import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({ db: {} }));

vi.mock("@/lib/org-context", () => ({
  requireOrgId: vi.fn(),
}));
vi.mock("@/lib/rbac", () => ({
  hasPermission: vi.fn(),
}));
vi.mock("@/lib/billing/subscriptions", () => ({
  getOrganizationSubscription: vi.fn(),
  upgradeSubscription: vi.fn(),
  downgradeSubscription: vi.fn(),
}));
vi.mock("@/lib/billing/usage", () => ({
  checkLimit: vi.fn(),
}));
vi.mock("@/lib/billing/plans", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/billing/plans")>();
  return { ...mod, listPlans: vi.fn() };
});
vi.mock("@/lib/billing/invoices", () => ({
  createBillingInvoice: vi.fn(),
  markInvoicePaid: vi.fn(),
}));
vi.mock("@/lib/billing/payments", () => ({
  createBillingPayment: vi.fn(),
  completePayment: vi.fn(),
}));
vi.mock("@/lib/billing/providers", () => ({
  getProvider: vi.fn(),
}));

import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import {
  getOrganizationSubscription,
  upgradeSubscription,
  downgradeSubscription,
} from "@/lib/billing/subscriptions";
import { checkLimit } from "@/lib/billing/usage";
import { listPlans } from "@/lib/billing/plans";
import { createBillingInvoice, markInvoicePaid } from "@/lib/billing/invoices";
import { createBillingPayment, completePayment } from "@/lib/billing/payments";
import { getProvider } from "@/lib/billing/providers";
import { POST } from "@/app/(core)/api/billing/plan-change/route";

const requireOrgIdMock = vi.mocked(requireOrgId);
const hasPermissionMock = vi.mocked(hasPermission);
const getOrgSubMock = vi.mocked(getOrganizationSubscription);
const upgradeMock = vi.mocked(upgradeSubscription);
const downgradeMock = vi.mocked(downgradeSubscription);
const checkLimitMock = vi.mocked(checkLimit);
const listPlansMock = vi.mocked(listPlans);
const createInvoiceMock = vi.mocked(createBillingInvoice);
const markPaidMock = vi.mocked(markInvoicePaid);
const createPaymentMock = vi.mocked(createBillingPayment);
const completePaymentMock = vi.mocked(completePayment);
const getProviderMock = vi.mocked(getProvider);

const starter = {
  id: "plan_starter",
  code: "starter",
  name: "Starter",
  displayName: "Starter",
  priceMonthly: 699,
  priceYearly: 6990,
  currency: "MAD",
};
const pro = {
  id: "plan_pro",
  code: "pro",
  name: "Pro",
  displayName: "Pro",
  priceMonthly: 2499,
  priceYearly: 24990,
  currency: "MAD",
};

function sub(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub1",
    organizationId: "org1",
    planId: starter.id,
    billingInterval: "MONTHLY",
    status: "ACTIVE",
    currentPeriodStart: new Date("2026-08-01T00:00:00Z"),
    plan: { ...starter },
    ...overrides,
  };
}

function mockProvider(name = "mock") {
  return {
    name,
    createCheckout: vi.fn(async (params: { amount: number; currency: string }) => ({
      sessionId: `cs_${name}_1`,
      url: `https://pay.test/${name}`,
      status: "PENDING" as const,
      amount: params.amount,
      currency: params.currency,
    })),
    verifyPayment: vi.fn(),
    processRefund: vi.fn(),
  };
}

function postRequest(orgId: string) {
  return new Request(`http://localhost/api/billing/plan-change`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ subscriptionId: orgId, newPlanId: "plan_pro" }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  requireOrgIdMock.mockResolvedValue({ organizationId: "org1", user: { id: "u1" } } as never);
  hasPermissionMock.mockResolvedValue(true);
  getProviderMock.mockReturnValue(mockProvider("mock"));
  createInvoiceMock.mockResolvedValue({ id: "inv1" } as never);
  createPaymentMock.mockResolvedValue({ id: "pay1" } as never);
  markPaidMock.mockResolvedValue({ id: "inv1", status: "PAID" } as never);
  completePaymentMock.mockResolvedValue({ id: "pay1", status: "SUCCEEDED" } as never);
  upgradeMock.mockResolvedValue({ id: "sub1", plan: pro } as never);
  downgradeMock.mockResolvedValue({ id: "sub1", plan: starter } as never);
});

describe("QA - plan change requires payment for upgrades", () => {
  it("charges the monthly price difference before upgrading", async () => {
    getOrgSubMock.mockResolvedValue(sub() as never);
    listPlansMock.mockResolvedValue([starter, pro] as never[]);

    const resp = await POST(postRequest("sub1"));

    expect(resp.status).toBe(200);
    const body = await resp.json();

    expect(createInvoiceMock).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1800, planId: "plan_pro", subscriptionId: "sub1", organizationId: "org1" })
    );
    expect(createPaymentMock).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1800, idempotencyKey: "plan_change_sub1_plan_pro" })
    );
    expect(markPaidMock).toHaveBeenCalledWith("inv1");
    expect(completePaymentMock).toHaveBeenCalled();
    expect(upgradeMock).toHaveBeenCalledWith("sub1", "plan_pro");
    expect(downgradeMock).not.toHaveBeenCalled();
    expect(body.payment).toEqual({ id: "inv1", amount: 1800 });
  });

  it("uses annual totals when the subscription bills yearly (no *12 inflation)", async () => {
    getOrgSubMock.mockResolvedValue(sub({ billingInterval: "YEARLY" }) as never);
    listPlansMock.mockResolvedValue([starter, pro] as never[]);

    const resp = await POST(postRequest("sub1"));

    expect(resp.status).toBe(200);
    expect(createInvoiceMock).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 18000 }) // 24990 - 6990, NOT (24990*12) - (6990*12)
    );
    expect(upgradeMock).toHaveBeenCalledWith("sub1", "plan_pro");
  });

  it("does not create a second charge when the plan was already switched", async () => {
    getOrgSubMock.mockResolvedValue(sub() as never);
    listPlansMock.mockResolvedValue([starter, pro] as never[]);

    const resp = await POST(
      new Request("http://localhost/api/billing/plan-change", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscriptionId: "sub1", newPlanId: "plan_starter" }),
      })
    );

    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.alreadyOnPlan).toBe(true);
    expect(createInvoiceMock).not.toHaveBeenCalled();
    expect(upgradeMock).not.toHaveBeenCalled();
  });

  it("returns 202 pending payment for a real (non-mock) provider without switching", async () => {
    getOrgSubMock.mockResolvedValue(sub() as never);
    listPlansMock.mockResolvedValue([starter, pro] as never[]);
    getProviderMock.mockReturnValue(mockProvider("stripe"));

    const resp = await POST(postRequest("sub1"));

    expect(resp.status).toBe(202);
    const body = await resp.json();
    expect(body.requiresPayment).toBe(true);
    expect(body.checkout.sessionId).toBe("cs_stripe_1");
    expect(upgradeMock).not.toHaveBeenCalled();
    expect(markPaidMock).not.toHaveBeenCalled();
  });
});

describe("QA - plan change downgrades stay free (no invoice)", () => {
  beforeEach(() => {
    checkLimitMock.mockResolvedValue({ limit: null, allowed: true, current: 0 } as never);
  });

  it("calls downgradeSubscription on a cheaper plan without charging", async () => {
    getOrgSubMock.mockResolvedValue(sub({ planId: pro.id, plan: { ...pro } }) as never);
    listPlansMock.mockResolvedValue([starter, pro] as never[]);

    const resp = await POST(
      new Request("http://localhost/api/billing/plan-change", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscriptionId: "sub1", newPlanId: "plan_starter" }),
      })
    );

    expect(resp.status).toBe(200);
    expect(downgradeMock).toHaveBeenCalledWith("sub1", "plan_starter");
    expect(createInvoiceMock).not.toHaveBeenCalled();
    expect(upgradeMock).not.toHaveBeenCalled();
  });

  it("requires confirmation when current usage exceeds the target plan limits", async () => {
    getOrgSubMock.mockResolvedValue(sub({ planId: pro.id, plan: { ...pro } }) as never);
    listPlansMock.mockResolvedValue([starter, pro] as never[]);
    checkLimitMock
      .mockResolvedValueOnce({ limit: 50, allowed: false, current: 90 } as never)
      .mockResolvedValue({ limit: null, allowed: true, current: 0 } as never);

    const resp = await POST(
      new Request("http://localhost/api/billing/plan-change", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscriptionId: "sub1", newPlanId: "plan_starter" }),
      })
    );

    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.requiresConfirmation).toBe(true);
    expect(downgradeMock).not.toHaveBeenCalled();
    expect(createInvoiceMock).not.toHaveBeenCalled();
  });
});