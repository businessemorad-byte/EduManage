import { describe, it, expect, vi, beforeEach } from "vitest";

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

  return {
    db: {
      subscription: model(),
      plan: model(),
      planFeature: model(),
      feature: model(),
      coupon: model(),
      couponUsage: model(),
      billingInvoice: model(),
      billingPayment: model(),
      auditLog: model(),
      organization: model(),
    },
  };
});

import { db } from "@/lib/prisma";
import { createPlan, setPlanFeatures, calculatePrice, calculateMonthlyPrice } from "@/lib/billing/plans";
import { createSubscription, activateSubscription, upgradeSubscription, downgradeSubscription, cancelSubscription, reactivateSubscription } from "@/lib/billing/subscriptions";
import { createBillingInvoice, markInvoicePaid } from "@/lib/billing/invoices";
import { createBillingPayment, completePayment } from "@/lib/billing/payments";
import { createCoupon, calculateDiscount, recordCouponUsage, validateCoupon } from "@/lib/billing/coupons";
import { calculateMRR, calculateARR, calculateChurnRate } from "@/lib/billing/metrics";
import { canTransition } from "@/lib/subscription";
import { SubscriptionStatus } from "@/lib/constants";

beforeEach(() => {
  vi.resetAllMocks();
});

// ─── Plan Management ──────────────────────────────────────────

describe("Billing - Plan Management", () => {
  it("should create a plan with defaults", async () => {
    vi.mocked(db.plan.create).mockResolvedValue({
      id: "plan1",
      name: "Standard",
      code: "STANDARD",
      priceMonthly: new Decimal(29),
      trialDurationDays: 14,
      sortOrder: 1,
      features: [],
    } as never);

    const result = await createPlan({
      name: "Standard",
      code: "STANDARD",
      displayName: "Standard Plan",
    });

    expect(db.plan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Standard",
          code: "STANDARD",
          trialDurationDays: 14,
          sortOrder: 0,
        }),
      })
    );
    expect(result.name).toBe("Standard");
  });

  it("should set plan features", async () => {
    vi.mocked(db.feature.upsert).mockResolvedValue({ id: "f1", key: "MAX_STUDENTS" } as never);
    vi.mocked(db.planFeature.upsert).mockResolvedValue({} as never);

    await setPlanFeatures("plan1", [
      { featureKey: "MAX_STUDENTS", isEnabled: true, limit: 100 },
    ]);

    expect(db.feature.upsert).toHaveBeenCalledTimes(1);
    expect(db.planFeature.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { planId_featureId: { planId: "plan1", featureId: "f1" } },
        create: expect.objectContaining({
          planId: "plan1",
          isEnabled: true,
          limit: 100,
        }),
      })
    );
  });

  it("should calculate monthly price from yearly", async () => {
    const plan = { priceMonthly: 29, priceYearly: 290 };
    const yearly = calculatePrice(plan, "YEARLY");
    const monthly = calculateMonthlyPrice(plan, "YEARLY");
    expect(yearly).toBe(290 * 12);
    expect(monthly).toBeCloseTo(290 / 12, 2);
  });
});

import { Decimal } from "@prisma/client/runtime/client";

// ─── Subscription Lifecycle ───────────────────────────────────

describe("Billing - Subscription Lifecycle", () => {
  it("should create a trial subscription", async () => {
    vi.mocked(db.subscription.findFirst).mockResolvedValue(null);
    vi.mocked(db.subscription.create).mockResolvedValue({
      id: "sub1",
      status: "TRIAL",
      trialEndsAt: new Date(Date.now() + 14 * 86400000),
    } as never);

    const result = await createSubscription({
      organizationId: "org1",
      planId: "plan1",
      trialDays: 14,
    });

    expect(db.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "TRIAL",
        }),
      })
    );
    expect(result.status).toBe("TRIAL");
  });

  it("should create a subscription without trial", async () => {
    vi.mocked(db.subscription.findFirst).mockResolvedValue(null);
    vi.mocked(db.subscription.create).mockResolvedValue({
      id: "sub1",
      status: "ACTIVE",
    } as never);

    const result = await createSubscription({
      organizationId: "org1",
      planId: "plan1",
    });

    expect(result.status).toBe("ACTIVE");
  });

  it("should reject subscription when active already exists", async () => {
    vi.mocked(db.subscription.findFirst).mockResolvedValue({
      id: "existing",
      status: "ACTIVE",
    } as never);

    await expect(
      createSubscription({ organizationId: "org1", planId: "plan1" })
    ).rejects.toThrow("Organization already has an active subscription");
  });

  it("should activate a trial subscription", async () => {
    vi.mocked(db.subscription.findUnique).mockResolvedValue({
      id: "sub1",
      status: "TRIAL",
      billingInterval: "MONTHLY",
    } as never);
    vi.mocked(db.subscription.update).mockResolvedValue({
      id: "sub1",
      status: "ACTIVE",
    } as never);

    const result = await activateSubscription("sub1");

    expect(result.status).toBe("ACTIVE");
    expect(db.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: SubscriptionStatus.ACTIVE,
          trialEndsAt: null,
        }),
      })
    );
  });

  it("should reject activation from CANCELLED status", async () => {
    vi.mocked(db.subscription.findUnique).mockResolvedValue({
      id: "sub1",
      status: "CANCELLED",
    } as never);

    await expect(activateSubscription("sub1")).rejects.toThrow(
      "Cannot activate from CANCELLED"
    );
  });

  it("should upgrade a subscription to higher plan", async () => {
    vi.mocked(db.subscription.findUnique).mockResolvedValue({
      id: "sub1",
      status: "ACTIVE",
      planId: "plan1",
      plan: { id: "plan1", sortOrder: 1, priceMonthly: new Decimal(29) },
    } as never);
    vi.mocked(db.plan.findUnique).mockResolvedValue({
      id: "plan2",
      sortOrder: 2,
      priceMonthly: new Decimal(79),
      isActive: true,
    } as never);
    vi.mocked(db.subscription.update).mockResolvedValue({
      id: "sub1",
      planId: "plan2",
    } as never);

    const result = await upgradeSubscription("sub1", "plan2");

    expect(result.planId).toBe("plan2");
  });

  it("should reject upgrade to lower-priced plan", async () => {
    vi.mocked(db.subscription.findUnique).mockResolvedValue({
      id: "sub1",
      status: "ACTIVE",
      planId: "plan1",
      plan: { id: "plan1", sortOrder: 2, priceMonthly: new Decimal(79) },
    } as never);
    vi.mocked(db.plan.findUnique).mockResolvedValue({
      id: "plan0",
      sortOrder: 1,
      priceMonthly: new Decimal(29),
      isActive: true,
    } as never);

    await expect(
      upgradeSubscription("sub1", "plan0")
    ).rejects.toThrow("This is not an upgrade");
  });

  it("should downgrade a subscription to lower plan", async () => {
    vi.mocked(db.subscription.findUnique).mockResolvedValue({
      id: "sub1",
      status: "ACTIVE",
      planId: "plan2",
      plan: { id: "plan2", sortOrder: 2, priceMonthly: new Decimal(79) },
    } as never);
    vi.mocked(db.plan.findUnique).mockResolvedValue({
      id: "plan1",
      sortOrder: 1,
      priceMonthly: new Decimal(29),
      isActive: true,
    } as never);
    vi.mocked(db.subscription.update).mockResolvedValue({
      id: "sub1",
      planId: "plan1",
    } as never);

    const result = await downgradeSubscription("sub1", "plan1");

    expect(result.planId).toBe("plan1");
  });

  it("should cancel a subscription immediately", async () => {
    vi.mocked(db.subscription.findUnique).mockResolvedValue({
      id: "sub1",
      status: "ACTIVE",
      organizationId: "org1",
    } as never);
    vi.mocked(db.subscription.update).mockResolvedValue({
      id: "sub1",
      status: "CANCELLED",
      organizationId: "org1",
    } as never);

    const result = await cancelSubscription("sub1", false, "Not satisfied");

    expect(result.status).toBe("CANCELLED");
  });

  it("should cancel at period end without changing status", async () => {
    vi.mocked(db.subscription.findUnique).mockResolvedValue({
      id: "sub1",
      status: "ACTIVE",
      organizationId: "org1",
    } as never);
    vi.mocked(db.subscription.update).mockResolvedValue({
      id: "sub1",
      cancelAtPeriodEnd: true,
    } as never);

    const result = await cancelSubscription("sub1", true);

    expect(result.cancelAtPeriodEnd).toBe(true);
  });

  it("should reactivate a subscription marked for cancellation", async () => {
    vi.mocked(db.subscription.findUnique).mockResolvedValue({
      id: "sub1",
      status: "ACTIVE",
      cancelAtPeriodEnd: true,
    } as never);
    vi.mocked(db.subscription.update).mockResolvedValue({
      id: "sub1",
      cancelAtPeriodEnd: false,
    } as never);

    const result = await reactivateSubscription("sub1");

    expect(result.cancelAtPeriodEnd).toBe(false);
  });

  it("should reject reactivation of expired subscription", async () => {
    vi.mocked(db.subscription.findUnique).mockResolvedValue({
      id: "sub1",
      status: "EXPIRED",
    } as never);

    await expect(reactivateSubscription("sub1")).rejects.toThrow(
      "Cannot reactivate a canceled or expired subscription"
    );
  });
});

// ─── Billing Invoices & Payments ──────────────────────────────

describe("Billing - Invoices & Payments", () => {
  it("should create a billing invoice", async () => {
    vi.mocked(db.plan.findUnique).mockResolvedValue({
      id: "plan1",
      displayName: "Standard",
      currency: "USD",
    } as never);
    vi.mocked(db.billingInvoice.create).mockResolvedValue({
      id: "bil1",
      invoiceNumber: "BIL-1",
      totalAmount: new Decimal(29),
    } as never);

    const result = await createBillingInvoice({
      organizationId: "org1",
      subscriptionId: "sub1",
      planId: "plan1",
      amount: 29,
    });

    expect(db.billingInvoice.create).toHaveBeenCalledTimes(1);
    expect(result.invoiceNumber).toBe("BIL-1");
  });

  it("should create a billing invoice with coupon discount", async () => {
    vi.mocked(db.plan.findUnique).mockResolvedValue({
      id: "plan1",
      displayName: "Standard",
      currency: "USD",
    } as never);
    vi.mocked(db.coupon.findUnique).mockResolvedValue({
      id: "coup1",
      discountType: "PERCENTAGE",
      discountValue: new Decimal(10),
      isActive: true,
    } as never);
    vi.mocked(db.billingInvoice.create).mockResolvedValue({
      id: "bil1",
      totalAmount: new Decimal(26.1),
    } as never);

    const result = await createBillingInvoice({
      organizationId: "org1",
      subscriptionId: "sub1",
      planId: "plan1",
      amount: 29,
      couponId: "coup1",
    });

    expect(result.totalAmount.toNumber()).toBeCloseTo(26.1, 1);
  });

  it("should mark billing invoice as paid", async () => {
    vi.mocked(db.billingInvoice.update).mockResolvedValue({
      id: "bil1",
      status: "PAID",
      paidAt: new Date(),
    } as never);

    const result = await markInvoicePaid("bil1");

    expect(db.billingInvoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PAID" }),
      })
    );
    expect(result.status).toBe("PAID");
  });

  it("should create a billing payment", async () => {
    vi.mocked(db.billingPayment.create).mockResolvedValue({
      id: "pay1",
      amount: 29,
      status: "PENDING",
    } as never);

    const result = await createBillingPayment({
      organizationId: "org1",
      invoiceId: "bil1",
      amount: 29,
      provider: "stripe",
    });

    expect(db.billingPayment.create).toHaveBeenCalledTimes(1);
    expect(result.amount).toBe(29);
  });

  it("should not duplicate payment with same idempotency key", async () => {
    vi.mocked(db.billingPayment.findUnique).mockResolvedValue({
      id: "existing-pay",
      amount: 29,
    } as never);

    const result = await createBillingPayment({
      organizationId: "org1",
      invoiceId: "bil1",
      amount: 29,
      idempotencyKey: "key-123",
    });

    expect(db.billingPayment.create).not.toHaveBeenCalled();
    expect(result.id).toBe("existing-pay");
  });

  it("should complete a billing payment", async () => {
    vi.mocked(db.billingPayment.update).mockResolvedValue({
      id: "pay1",
      status: "SUCCEEDED",
      organizationId: "org1",
      providerRef: "ref-stripe-123",
    } as never);

    const result = await completePayment("pay1", "ref-stripe-123");

    expect(result.status).toBe("SUCCEEDED");
    expect(result.providerRef).toBe("ref-stripe-123");
  });
});

// ─── Coupons ──────────────────────────────────────────────────

describe("Billing - Coupons", () => {
  it("should create a coupon", async () => {
    vi.mocked(db.coupon.create).mockResolvedValue({
      id: "coup1",
      code: "SAVE10",
      discountType: "PERCENTAGE",
      discountValue: new Decimal(10),
    } as never);

    const result = await createCoupon({
      code: "save10",
      discountType: "PERCENTAGE",
      discountValue: 10,
    });

    expect(result.code).toBe("SAVE10");
  });

  it("should validate active coupon", async () => {
    const now = new Date();
    vi.mocked(db.coupon.findUnique).mockResolvedValue({
      id: "coup1",
      code: "SAVE10",
      isActive: true,
      validFrom: new Date(now.getTime() - 86400000),
      validUntil: new Date(now.getTime() + 86400000),
      maxUses: 100,
      usedCount: 5,
      currency: null,
    } as never);
    vi.mocked(db.couponUsage.findFirst).mockResolvedValue(null);

    const result = await validateCoupon("SAVE10", "org1", 100);

    expect(result.valid).toBe(true);
    expect(result.couponId).toBe("coup1");
  });

  it("should reject expired coupon", async () => {
    vi.mocked(db.coupon.findUnique).mockResolvedValue({
      id: "coup1",
      code: "OLD",
      isActive: true,
      validFrom: new Date("2020-01-01"),
      validUntil: new Date("2020-12-31"),
      maxUses: null,
      usedCount: 0,
      currency: null,
    } as never);

    const result = await validateCoupon("OLD", "org1", 100);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Coupon has expired");
  });

  it("should reject coupon at usage limit", async () => {
    vi.mocked(db.coupon.findUnique).mockResolvedValue({
      id: "coup1",
      code: "FULL",
      isActive: true,
      validFrom: new Date("2020-01-01"),
      validUntil: null,
      maxUses: 10,
      usedCount: 10,
      currency: null,
    } as never);

    const result = await validateCoupon("FULL", "org1", 100);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Coupon usage limit reached");
  });

  it("should calculate percentage discount", () => {
    expect(calculateDiscount("PERCENTAGE", 10, 200)).toBe(20);
    expect(calculateDiscount("PERCENTAGE", 50, 100)).toBe(50);
  });

  it("should calculate fixed discount capped at subtotal", () => {
    expect(calculateDiscount("FIXED_AMOUNT", 30, 200)).toBe(30);
    expect(calculateDiscount("FIXED_AMOUNT", 500, 200)).toBe(200);
  });

  it("should record coupon usage", async () => {
    vi.mocked(db.coupon.update).mockResolvedValue({} as never);
    vi.mocked(db.couponUsage.create).mockResolvedValue({} as never);

    await recordCouponUsage("coup1", "org1", "inv1");

    expect(db.coupon.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { usedCount: { increment: 1 } },
      })
    );
  });
});

// ─── Metrics ──────────────────────────────────────────────────

describe("Billing - Metrics", () => {
  it("should calculate MRR from monthly subscriptions", async () => {
    vi.mocked(db.subscription.findMany).mockResolvedValue([
      { billingInterval: "MONTHLY", plan: { priceMonthly: new Decimal(29) } },
      { billingInterval: "MONTHLY", plan: { priceMonthly: new Decimal(79) } },
    ] as never);

    const result = await calculateMRR();

    expect(result.mrr).toBe(108);
    expect(result.count).toBe(2);
  });

  it("should calculate MRR with yearly subscriptions normalized", async () => {
    vi.mocked(db.subscription.findMany).mockResolvedValue([
      { billingInterval: "YEARLY", plan: { priceMonthly: null, priceYearly: new Decimal(290) } },
    ] as never);

    const result = await calculateMRR();

    expect(result.mrr).toBe(24.17);
    expect(result.count).toBe(1);
  });

  it("should calculate ARR from MRR", async () => {
    vi.mocked(db.subscription.findMany).mockResolvedValue([
      { billingInterval: "MONTHLY", plan: { priceMonthly: new Decimal(100) } },
    ] as never);

    const result = await calculateARR();

    expect(result.arr).toBe(1200);
  });

  it("should calculate churn rate", async () => {
    vi.mocked(db.subscription.count)
      .mockResolvedValueOnce(100) // totalStart
      .mockResolvedValueOnce(5);  // canceled

    const result = await calculateChurnRate(1);

    expect(result.churnRate).toBe(5);
    expect(result.canceledCount).toBe(5);
    expect(result.totalStartCount).toBe(100);
  });

  it("should return 0 churn for no starting subscriptions", async () => {
    vi.mocked(db.subscription.count)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const result = await calculateChurnRate(1);

    expect(result.churnRate).toBe(0);
  });
});

// ─── State Transitions ────────────────────────────────────────

describe("Billing - State Transition Validation", () => {
  it("should allow TRIAL -> ACTIVE", () => {
    expect(canTransition(SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE)).toBe(true);
  });

  it("should allow TRIAL -> EXPIRED", () => {
    expect(canTransition(SubscriptionStatus.TRIAL, SubscriptionStatus.EXPIRED)).toBe(true);
  });

  it("should not allow TRIAL -> CANCELLED", () => {
    expect(canTransition(SubscriptionStatus.TRIAL, SubscriptionStatus.CANCELLED)).toBe(false);
  });

  it("should allow ACTIVE -> PAST_DUE", () => {
    expect(canTransition(SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE)).toBe(true);
  });

  it("should allow ACTIVE -> CANCELLED", () => {
    expect(canTransition(SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED)).toBe(true);
  });

  it("should not allow ACTIVE -> TRIAL", () => {
    expect(canTransition(SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL)).toBe(false);
  });

  it("should allow PAST_DUE -> ACTIVE", () => {
    expect(canTransition(SubscriptionStatus.PAST_DUE, SubscriptionStatus.ACTIVE)).toBe(true);
  });

  it("should allow PAST_DUE -> EXPIRED", () => {
    expect(canTransition(SubscriptionStatus.PAST_DUE, SubscriptionStatus.EXPIRED)).toBe(true);
  });

  it("should not allow CANCELLED -> anything", () => {
    expect(canTransition(SubscriptionStatus.CANCELLED, SubscriptionStatus.ACTIVE)).toBe(false);
    expect(canTransition(SubscriptionStatus.CANCELLED, SubscriptionStatus.TRIAL)).toBe(false);
  });

  it("should allow EXPIRED -> ACTIVE only (renewal after expiration)", () => {
    expect(canTransition(SubscriptionStatus.EXPIRED, SubscriptionStatus.ACTIVE)).toBe(true);
    expect(canTransition(SubscriptionStatus.EXPIRED, SubscriptionStatus.TRIAL)).toBe(false);
    expect(canTransition(SubscriptionStatus.EXPIRED, SubscriptionStatus.CANCELLED)).toBe(false);
  });
});
