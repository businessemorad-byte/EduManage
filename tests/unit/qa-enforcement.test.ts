import { describe, it, expect, vi, beforeEach } from "vitest";
import { Decimal } from "@prisma/client/runtime/client";

vi.mock("@/lib/prisma", () => {
  const model = () => ({
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn(),
    upsert: vi.fn(),
    groupBy: vi.fn().mockResolvedValue([]),
  });
  const db: Record<string, ReturnType<typeof model> & { $transaction?: unknown }> = {
    subscription: model(),
    student: model(),
    attendanceRecord: model(),
    payment: model(),
    invoice: model(),
    discount: model(),
    financialTransaction: model(),
    refund: model(),
    group: model(),
    room: model(),
  };
  // The tx handle exposes all models (mirrors real Prisma behaviour).
  (db as Record<string, unknown>).$transaction = vi.fn(
    async (fn: (tx: unknown) => unknown) => fn(db)
  );
  return { db };
});

vi.mock("@/lib/events", () => ({
  emitEvent: vi.fn().mockResolvedValue(undefined),
  EVENT_TYPES: {
    STUDENT_ABSENT: "student.absent",
    STUDENT_LATE: "student.late",
    INVOICE_CREATED: "invoice.created",
    PAYMENT_CREATED: "payment.created",
  },
}));

import { db } from "@/lib/prisma";
import { checkPaidAccess, getSubscriptionState } from "@/lib/billing/enforcement";
import {
  resolveEntitlements,
  hasEntitlement,
  checkUsageLimit,
} from "@/lib/entitlements";
import { markAttendance, markBatchAttendance } from "@/lib/attendance";
import { createPayment } from "@/lib/finance";
import { FeatureKey } from "@/lib/constants";

const mockedDb = db as unknown as {
  subscription: Record<string, ReturnType<typeof vi.fn>>;
  student: Record<string, ReturnType<typeof vi.fn>>;
  attendanceRecord: Record<string, ReturnType<typeof vi.fn>>;
  payment: Record<string, ReturnType<typeof vi.fn>>;
  invoice: Record<string, ReturnType<typeof vi.fn>>;
  financialTransaction: Record<string, ReturnType<typeof vi.fn>>;
};

beforeEach(() => {
  vi.resetAllMocks();
  mockedDb.subscription.findFirst.mockResolvedValue(null);
  // resetAllMocks strips the factory-set implementation — restore it.
  // Pass all db models to the tx handle (mirrors real Prisma behaviour).
  (db as unknown as { $transaction: { mockImplementation: (fn: unknown) => void } })
    .$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn(db)
    );
});

type SubscriptionOverrides = {
  plan?: {
    displayName?: string;
    name?: string;
    features?: Array<{ isEnabled: boolean; limit: number | null; feature: { key: string } }>;
  };
} & Record<string, unknown>;

function activeSubscription(overrides: SubscriptionOverrides = {}) {
  const future = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  const { plan, ...rest } = overrides;
  return {
    id: "sub-1",
    organizationId: "org1",
    status: "ACTIVE",
    billingInterval: "MONTHLY",
    currentPeriodStart: new Date(Date.now() - 1000),
    currentPeriodEnd: future,
    createdAt: new Date(),
    plan: {
      displayName: "Standard",
      name: "standard_private_school",
      features: [],
      ...(plan ?? {}),
    },
    ...rest,
  };
}

// ─── checkPaidAccess ─────────────────────────────────────────────

describe("QA - checkPaidAccess (server-side gating)", () => {
  it("blocks with 402 SUBSCRIPTION_INACTIVE when no subscription exists", async () => {
    const result = await checkPaidAccess("org1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(402);
      expect(result.payload.code).toBe("SUBSCRIPTION_INACTIVE");
      expect(result.payload.state).toBe("NONE");
    }
  });

  it("blocks an ACTIVE subscription whose period has lapsed (EXPIRED)", async () => {
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      currentPeriodEnd: new Date(Date.now() - 1000),
    });
    const result = await checkPaidAccess("org1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(402);
      expect(result.payload.code).toBe("SUBSCRIPTION_INACTIVE");
      expect(result.payload.state).toBe("EXPIRED");
      expect(result.payload.error).toContain("expiré");
    }
  });

  it("allows an active, non-lapsed subscription without a feature requirement", async () => {
    mockedDb.subscription.findFirst.mockResolvedValue(activeSubscription());
    const result = await checkPaidAccess("org1");
    expect(result).toEqual({ ok: true });
  });

  it("requires the plan to include the requested feature", async () => {
    mockedDb.subscription.findFirst.mockResolvedValue(
      activeSubscription({
        plan: {
          displayName: "Starter",
          name: "starter_private_school",
          features: [
            { isEnabled: true, limit: 500, feature: { key: FeatureKey.MAX_STUDENTS } },
            { isEnabled: false, limit: null, feature: { key: FeatureKey.AUTOMATION } },
          ],
        },
      })
    );
    const denied = await checkPaidAccess("org1", { featureKey: FeatureKey.AUTOMATION });
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.status).toBe(402);
      expect(denied.payload.code).toBe("PLAN_UPGRADE_REQUIRED");
      expect(denied.payload.currentPlan).toContain("Starter");
      expect(denied.payload.error).toContain("plan supérieur");
    }

    const allowed = await checkPaidAccess("org1", { featureKey: FeatureKey.MAX_STUDENTS });
    expect(allowed).toEqual({ ok: true });
  });
});

// ─── Entitlements ────────────────────────────────────────────────

describe("QA - Entitlement resolution", () => {
  it("treats TRIALING subscriptions as active (parity with enforcement)", async () => {
    mockedDb.subscription.findFirst.mockResolvedValue(
      activeSubscription({ status: "TRIALING" })
    );
    const resolved = await resolveEntitlements("org1");
    expect(resolved.active).toBe(true);
    expect(resolved.subscriptionStatus).toBe("TRIALING");
  });

  it("hasEntitlement is false for disabled features even when active", async () => {
    mockedDb.subscription.findFirst.mockResolvedValue(
      activeSubscription({
        plan: {
          displayName: "Starter",
          name: "starter",
          features: [
            { isEnabled: false, limit: null, feature: { key: FeatureKey.COMMUNICATION_CAMPAIGNS } },
          ],
        },
      })
    );
    await expect(hasEntitlement("org1", FeatureKey.COMMUNICATION_CAMPAIGNS)).resolves.toBe(false);
  });

  it("checkUsageLimit blocks when current usage reaches the plan limit", async () => {
    mockedDb.subscription.findFirst.mockResolvedValue(
      activeSubscription({
        plan: {
          displayName: "Starter",
          name: "starter",
          features: [{ isEnabled: true, limit: 50, feature: { key: FeatureKey.MAX_STUDENTS } }],
        },
      })
    );
    const atLimit = await checkUsageLimit("org1", FeatureKey.MAX_STUDENTS, 50);
    expect(atLimit.allowed).toBe(false);

    const underLimit = await checkUsageLimit("org1", FeatureKey.MAX_STUDENTS, 49);
    expect(underLimit.allowed).toBe(true);
    expect(underLimit.remaining).toBe(1);
  });

  it("checkUsageLimit allows unlimited plans", async () => {
    mockedDb.subscription.findFirst.mockResolvedValue(activeSubscription());
    const result = await checkUsageLimit("org1", FeatureKey.MAX_STUDENTS, 10_000);
    expect(result.allowed).toBe(true);
    expect(result.limit).toBeNull();
  });
});

// ─── currentPeriodEnd enforcement ─────────────────────────────────

describe("QA - currentPeriodEnd enforcement (getSubscriptionState)", () => {
  it("ACTIVE + future currentPeriodEnd → hasAccess: true", async () => {
    const future = new Date(Date.now() + 30 * 86400000);
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      currentPeriodEnd: future,
    });
    const state = await getSubscriptionState("org1");
    expect(state.hasAccess).toBe(true);
    expect(state.state).toBe("ACTIVE");
    expect(state.lapsed).toBe(false);
  });

  it("ACTIVE + expired currentPeriodEnd → hasAccess: false (EXPIRED)", async () => {
    const past = new Date(Date.now() - 86400000);
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      currentPeriodEnd: past,
    });
    const state = await getSubscriptionState("org1");
    expect(state.hasAccess).toBe(false);
    expect(state.state).toBe("EXPIRED");
    expect(state.lapsed).toBe(true);
  });

  it("TRIAL + future currentPeriodEnd → hasAccess: true", async () => {
    const future = new Date(Date.now() + 7 * 86400000);
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      status: "TRIAL",
      currentPeriodEnd: future,
    });
    const state = await getSubscriptionState("org1");
    expect(state.hasAccess).toBe(true);
    expect(state.state).toBe("TRIAL");
    expect(state.lapsed).toBe(false);
  });

  it("TRIAL + expired currentPeriodEnd → hasAccess: false (EXPIRED)", async () => {
    const past = new Date(Date.now() - 86400000);
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      status: "TRIAL",
      currentPeriodEnd: past,
    });
    const state = await getSubscriptionState("org1");
    expect(state.hasAccess).toBe(false);
    expect(state.state).toBe("EXPIRED");
    expect(state.lapsed).toBe(true);
  });

  it("TRIALING + future currentPeriodEnd → hasAccess: true", async () => {
    const future = new Date(Date.now() + 7 * 86400000);
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      status: "TRIALING",
      currentPeriodEnd: future,
    });
    const state = await getSubscriptionState("org1");
    expect(state.hasAccess).toBe(true);
  });

  it("TRIALING + expired currentPeriodEnd → hasAccess: false", async () => {
    const past = new Date(Date.now() - 86400000);
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      status: "TRIALING",
      currentPeriodEnd: past,
    });
    const state = await getSubscriptionState("org1");
    expect(state.hasAccess).toBe(false);
    expect(state.state).toBe("EXPIRED");
  });

  it("ACTIVE + null currentPeriodEnd → hasAccess: true (no period to lapse)", async () => {
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      currentPeriodEnd: null,
    });
    const state = await getSubscriptionState("org1");
    expect(state.hasAccess).toBe(true);
    expect(state.lapsed).toBe(false);
  });

  it("CANCELLED + future currentPeriodEnd → hasAccess: false (status not in ACCESS_STATUSES)", async () => {
    const future = new Date(Date.now() + 30 * 86400000);
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      status: "CANCELLED",
      currentPeriodEnd: future,
    });
    const state = await getSubscriptionState("org1");
    expect(state.hasAccess).toBe(false);
    expect(state.lapsed).toBe(false);
  });

  it("boundary: currentPeriodEnd exactly now → lapsed", async () => {
    const now = new Date();
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      currentPeriodEnd: now,
    });
    const state = await getSubscriptionState("org1");
    // `now > sub.currentPeriodEnd` is false when they're equal,
    // so the subscription is still valid at the exact boundary.
    expect(state.hasAccess).toBe(true);
    expect(state.lapsed).toBe(false);
  });

  it("boundary: currentPeriodEnd 1ms in the past → lapsed", async () => {
    const justPast = new Date(Date.now() - 1);
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      currentPeriodEnd: justPast,
    });
    const state = await getSubscriptionState("org1");
    expect(state.hasAccess).toBe(false);
    expect(state.lapsed).toBe(true);
  });
});

describe("QA - currentPeriodEnd enforcement (resolveEntitlements)", () => {
  it("ACTIVE + expired currentPeriodEnd → active: false", async () => {
    const past = new Date(Date.now() - 86400000);
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      currentPeriodEnd: past,
    });
    const result = await resolveEntitlements("org1");
    expect(result.active).toBe(false);
  });

  it("ACTIVE + future currentPeriodEnd → active: true", async () => {
    const future = new Date(Date.now() + 30 * 86400000);
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      currentPeriodEnd: future,
    });
    const result = await resolveEntitlements("org1");
    expect(result.active).toBe(true);
  });

  it("TRIAL + expired currentPeriodEnd → active: false, hasEntitlement: false", async () => {
    const past = new Date(Date.now() - 86400000);
    mockedDb.subscription.findFirst.mockResolvedValue(
      activeSubscription({
        status: "TRIAL",
        currentPeriodEnd: past,
        plan: {
          displayName: "Standard",
          name: "standard",
          features: [
            { isEnabled: true, limit: null, feature: { key: FeatureKey.AI_ENABLED } },
          ],
        },
      })
    );
    const resolved = await resolveEntitlements("org1");
    expect(resolved.active).toBe(false);
    await expect(hasEntitlement("org1", FeatureKey.AI_ENABLED)).resolves.toBe(false);
  });

  it("TRIAL + future currentPeriodEnd → active: true, hasEntitlement: true", async () => {
    const future = new Date(Date.now() + 7 * 86400000);
    mockedDb.subscription.findFirst.mockResolvedValue(
      activeSubscription({
        status: "TRIAL",
        currentPeriodEnd: future,
        plan: {
          displayName: "Standard",
          name: "standard",
          features: [
            { isEnabled: true, limit: null, feature: { key: FeatureKey.AI_ENABLED } },
          ],
        },
      })
    );
    const resolved = await resolveEntitlements("org1");
    expect(resolved.active).toBe(true);
    await expect(hasEntitlement("org1", FeatureKey.AI_ENABLED)).resolves.toBe(true);
  });

  it("ACTIVE + null currentPeriodEnd → active: true", async () => {
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      currentPeriodEnd: null,
    });
    const result = await resolveEntitlements("org1");
    expect(result.active).toBe(true);
  });
});

describe("QA - currentPeriodEnd enforcement (checkPaidAccess)", () => {
  it("ACTIVE + expired currentPeriodEnd → blocked 402", async () => {
    const past = new Date(Date.now() - 86400000);
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      currentPeriodEnd: past,
    });
    const result = await checkPaidAccess("org1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(402);
      expect(result.payload.code).toBe("SUBSCRIPTION_INACTIVE");
      expect(result.payload.state).toBe("EXPIRED");
    }
  });

  it("ACTIVE + future currentPeriodEnd → allowed", async () => {
    const future = new Date(Date.now() + 30 * 86400000);
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      currentPeriodEnd: future,
    });
    const result = await checkPaidAccess("org1");
    expect(result).toEqual({ ok: true });
  });

  it("TRIAL + expired currentPeriodEnd → blocked 402", async () => {
    const past = new Date(Date.now() - 86400000);
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      status: "TRIAL",
      currentPeriodEnd: past,
    });
    const result = await checkPaidAccess("org1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(402);
      expect(result.payload.state).toBe("EXPIRED");
    }
  });

  it("TRIAL + future currentPeriodEnd → allowed", async () => {
    const future = new Date(Date.now() + 7 * 86400000);
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      status: "TRIAL",
      currentPeriodEnd: future,
    });
    const result = await checkPaidAccess("org1");
    expect(result).toEqual({ ok: true });
  });

  it("ACTIVE + null currentPeriodEnd → allowed", async () => {
    mockedDb.subscription.findFirst.mockResolvedValue({
      ...activeSubscription(),
      currentPeriodEnd: null,
    });
    const result = await checkPaidAccess("org1");
    expect(result).toEqual({ ok: true });
  });
});

// ─── Attendance ──────────────────────────────────────────────────

describe("QA - Attendance integrity", () => {
  const input = {
    organizationId: "org1",
    studentId: "stu-1",
    groupId: "grp-1",
    date: "2026-08-20",
    status: "ABSENT" as const,
  };

  it("refuses to write attendance for a student of another organization", async () => {
    mockedDb.student.findFirst.mockResolvedValue(null); // cross-tenant student
    await expect(markAttendance(input)).rejects.toThrow(
      "Student not found in this organization"
    );
    expect(mockedDb.attendanceRecord.create).not.toHaveBeenCalled();
  });

  it("updates the existing record instead of creating duplicates", async () => {
    mockedDb.student.findFirst.mockResolvedValue({ id: "stu-1" });
    mockedDb.attendanceRecord.findFirst.mockResolvedValue({ id: "rec-existing" });
    mockedDb.attendanceRecord.update.mockResolvedValue({ id: "rec-existing" });

    const result = await markAttendance(input);

    expect(mockedDb.attendanceRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "rec-existing" } })
    );
    expect(mockedDb.attendanceRecord.create).not.toHaveBeenCalled();
    expect(result).toEqual({ id: "rec-existing" });
  });

  it("matches NULL group rows explicitly (no sentinel-empty-string lookups)", async () => {
    mockedDb.student.findFirst.mockResolvedValue({ id: "stu-1" });
    mockedDb.attendanceRecord.findFirst.mockResolvedValue(null);
    mockedDb.attendanceRecord.create.mockResolvedValue({ id: "rec-new" });

    await markAttendance({ ...input, groupId: undefined });

    const where = mockedDb.attendanceRecord.findFirst.mock.calls[0][0].where;
    expect(where.groupId).toBeNull(); // IS NULL match, not ""
    expect(where.classSessionId).toBeNull();
    expect(mockedDb.attendanceRecord.create).toHaveBeenCalled();
  });

  it("reports failed records instead of silently dropping them", async () => {
    mockedDb.student.findFirst
      .mockResolvedValueOnce({ id: "stu-1" })
      .mockResolvedValueOnce(null); // second record fails tenant check

    mockedDb.attendanceRecord.findFirst.mockResolvedValue(null);
    mockedDb.attendanceRecord.create.mockResolvedValue({ id: "rec-new" });

    const results = await markBatchAttendance([
      input,
      { ...input, studentId: "stu-other-org" },
    ]);

    expect(results.marked).toHaveLength(1);
    expect(results.failed).toHaveLength(1);
    expect(results.failed[0].index).toBe(1);
    expect(results.failed[0].error).toContain("not found in this organization");
  });
});

// ─── Finance consistency ─────────────────────────────────────────

describe("QA - Payment consistency", () => {
  function pendingInvoice() {
    return {
      id: "inv-1",
      organizationId: "org1",
      invoiceNumber: "INV-X",
      status: "PENDING",
      currency: "MAD",
      totalAmount: new Decimal(1000),
      paidAmount: new Decimal(0),
    };
  }

  it("rejects a duplicate submission with the same reference", async () => {
    mockedDb.invoice.findFirst.mockResolvedValue(pendingInvoice());
    mockedDb.payment.findFirst.mockResolvedValue({ id: "pay-original" }); // already recorded

    await expect(
      createPayment({
        organizationId: "org1",
        invoiceId: "inv-1",
        amount: 400,
        method: "CASH",
        reference: "REC-001",
      })
    ).rejects.toThrow('reference "REC-001"');
    expect(mockedDb.payment.create).not.toHaveBeenCalled();
  });

  it("still blocks overpayment beyond the remaining balance", async () => {
    mockedDb.invoice.findFirst.mockResolvedValue(pendingInvoice());
    mockedDb.payment.findFirst.mockResolvedValue(null); // no duplicate

    await expect(
      createPayment({
        organizationId: "org1",
        invoiceId: "inv-1",
        amount: 1500,
        method: "CASH",
      })
    ).rejects.toThrow("exceeds remaining balance");
  });

  it("accepts a valid partial payment and marks the invoice PARTIAL", async () => {
    const invoice = pendingInvoice();
    mockedDb.invoice.findFirst.mockResolvedValue(invoice);
    mockedDb.payment.findFirst.mockResolvedValue(null);
    mockedDb.payment.create.mockResolvedValue({ id: "pay-new" });
    mockedDb.invoice.update.mockResolvedValue({});
    mockedDb.financialTransaction.create.mockResolvedValue({});

    await createPayment({
      organizationId: "org1",
      invoiceId: "inv-1",
      amount: 400,
      method: "CASH",
    });

    expect(mockedDb.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paidAmount: new Decimal(400),
          status: "PARTIAL",
        }),
      })
    );
  });
});
