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

  return { db: { aICreditBalance: model(), aICreditTransaction: model(), subscription: model() } };
});

import { db } from "@/lib/prisma";
import {
  PLAN_PRICING,
  PROMOTION_CONFIG,
  ANNUAL_BILLING_CONFIG,
  AI_CREDITS_MONTHLY,
  CREDIT_PACKAGES,
  computeAnnualPrice,
  computeAnnualSavings,
  computeFirstMonthPrice,
  getPriceForInterval,
  getTierPricing,
  formatMAD,
} from "@/lib/billing-config";
import { orgTypes } from "@/lib/pricing-plans";
import {
  calculateCredits,
  computeRemaining,
  consumeCredits,
  checkCredits,
} from "@/lib/ai-credits";
import {
  getSubscriptionState,
  assertSubscriptionActive,
  assertSubscriptionOwnership,
  SubscriptionInactiveError,
  billingErrorStatus,
} from "@/lib/billing/enforcement";
import { canTransition, getValidTransitions } from "@/lib/subscription";
import { OrganizationType, SubscriptionStatus } from "@/lib/constants";

beforeEach(() => {
  vi.resetAllMocks();
});

const ORG_KEYS = Object.values(OrganizationType);
const TIER_KEYS = ["starter", "standard", "pro", "ultimate"] as const;

// ─── 1. Final Prices ──────────────────────────────────────────

describe("Phase 14 - Final Pricing", () => {
  const expected: Record<OrganizationType, Record<string, number>> = {
    [OrganizationType.PRIVATE_SCHOOL]: { starter: 699, standard: 1499, pro: 2499, ultimate: 4999 },
    [OrganizationType.SUPPORT_CENTER]: { starter: 499, standard: 1199, pro: 1999, ultimate: 3499 },
    [OrganizationType.TRAINING_CENTER]: { starter: 699, standard: 1499, pro: 2499, ultimate: 4499 },
  };

  for (const orgType of ORG_KEYS) {
    for (const tier of TIER_KEYS) {
      it(`${orgType}/${tier} costs ${expected[orgType][tier]} DH/month`, () => {
        expect(PLAN_PRICING[orgType].tiers[tier].priceMonthly).toBe(expected[orgType][tier]);
      });
    }
  }

  it("has all three org types configured", () => {
    expect(Object.keys(PLAN_PRICING)).toEqual(
      expect.arrayContaining([
        OrganizationType.PRIVATE_SCHOOL,
        OrganizationType.SUPPORT_CENTER,
        OrganizationType.TRAINING_CENTER,
      ])
    );
  });

  it("getTierPricing resolves by org type and tier", () => {
    expect(getTierPricing(OrganizationType.PRIVATE_SCHOOL, "pro")?.priceMonthly).toBe(2499);
    expect(getTierPricing(OrganizationType.TRAINING_CENTER, "ultimate")?.priceMonthly).toBe(4499);
  });
});

// ─── 2. Annual Billing ────────────────────────────────────────

describe("Phase 14 - Annual Billing", () => {
  it("bills 10 months when paying annually", () => {
    expect(ANNUAL_BILLING_CONFIG.billedMonths).toBe(10);
  });

  it("annual price equals 10x monthly for every tier", () => {
    for (const orgType of ORG_KEYS) {
      for (const tier of TIER_KEYS) {
        const p = PLAN_PRICING[orgType].tiers[tier];
        expect(p.priceYearly).toBe(p.priceMonthly * 10);
        expect(computeAnnualPrice(p.priceMonthly)).toBe(p.priceMonthly * 10);
      }
    }
  });

  it("savings equal two free months for every tier", () => {
    for (const orgType of ORG_KEYS) {
      for (const tier of TIER_KEYS) {
        const p = PLAN_PRICING[orgType].tiers[tier];
        expect(computeAnnualSavings(p.priceMonthly)).toBe(p.priceMonthly * 2);
        expect(p.priceYearly).toBe(p.priceMonthly * 12 - computeAnnualSavings(p.priceMonthly));
      }
    }
  });

  it("getPriceForInterval returns the right price", () => {
    expect(getPriceForInterval(OrganizationType.PRIVATE_SCHOOL, "pro", "MONTHLY")).toBe(2499);
    expect(getPriceForInterval(OrganizationType.PRIVATE_SCHOOL, "pro", "YEARLY")).toBe(24990);
  });

  it("formats MAD prices", () => {
    expect(formatMAD(1499)).toMatch(/^1[\s\u202f\u00a0]499$/);
  });
});

// ─── 3. First Month Promotion (-50%) ──────────────────────────

describe("Phase 14 - First Month Promotion", () => {
  it("applies a 50% discount on the first month", () => {
    expect(PROMOTION_CONFIG.firstMonthDiscountPct).toBe(50);
    expect(computeFirstMonthPrice(699)).toBe(349.5);
    expect(computeFirstMonthPrice(4999)).toBe(2499.5);
  });

  it("promo label mentions the discount instead of a free month", () => {
    expect(PROMOTION_CONFIG.label).toContain("50%");
    expect(PROMOTION_CONFIG.label.toLowerCase()).not.toContain("offert");
  });

  it("pricing plans derive yearly price and savings for real cards", () => {
    const school = orgTypes.find((o) => o.orgType === "private_school")!;
    const pro = school.plans.find((p) => p.slug === "pro")!;
    expect(pro.priceMonthly).toBe(2499);
    expect(pro.priceYearly).toBe(24990);
    expect(pro.yearlySavings).toBe(4998);
  });

  it("pricing cards carry correct AI credit allocations", () => {
    for (const org of orgTypes) {
      const starter = org.plans.find((p) => p.slug === "starter")!;
      expect(starter.aiCredits).toBe(AI_CREDITS_MONTHLY.starter);
      const ultimate = org.plans.find((p) => p.slug === "ultimate")!;
      expect(ultimate.aiCredits).toBe(AI_CREDITS_MONTHLY.ultimate);
    }
  });
});

// ─── 4. AI Credit Allocations ─────────────────────────────────

describe("Phase 14 - AI Credit Allocations", () => {
  it("allocates plan allowances: 100k / 500k / 1M / 5M", () => {
    expect(AI_CREDITS_MONTHLY.starter).toBe(100_000);
    expect(AI_CREDITS_MONTHLY.standard).toBe(500_000);
    expect(AI_CREDITS_MONTHLY.pro).toBe(1_000_000);
    expect(AI_CREDITS_MONTHLY.ultimate).toBe(5_000_000);
  });

  it("sells credit packages at fixed DH prices", () => {
    const byId = new Map(CREDIT_PACKAGES.map((p) => [p.id, p]));
    expect(byId.get("credits_100k")).toMatchObject({ credits: 100_000, priceMad: 99 });
    expect(byId.get("credits_500k")).toMatchObject({ credits: 500_000, priceMad: 399 });
    expect(byId.get("credits_1m")).toMatchObject({ credits: 1_000_000, priceMad: 699 });
    expect(byId.get("credits_5m")).toMatchObject({ credits: 5_000_000, priceMad: 1199 });
  });

  it("consumption scales with model tier and output tokens", () => {
    const base = calculateCredits({ inputTokens: 1000, outputTokens: 0, modelTier: "CORE", feature: "chat" });
    expect(base).toBe(1);

    // output weighted 2x
    const weighted = calculateCredits({ inputTokens: 0, outputTokens: 1000, modelTier: "CORE", feature: "chat" });
    expect(weighted).toBe(2);

    // ADVANCED = x3
    const advanced = calculateCredits({ inputTokens: 1000, outputTokens: 1000, modelTier: "ADVANCED", feature: "report" });
    expect(advanced).toBe(9);
  });
});

// ─── 5. Credit Balance Semantics ──────────────────────────────

describe("Phase 14 - Credit Balance Semantics", () => {
  it("remaining = unused monthly + extras, floored at zero", () => {
    expect(computeRemaining({ monthlyAllowance: 1000, usedThisMonth: 400, extraCredits: 0 })).toBe(600);
    // Monthly overage does not retroactively eat purchased extras.
    expect(computeRemaining({ monthlyAllowance: 1000, usedThisMonth: 1200, extraCredits: 500 })).toBe(500);
    expect(computeRemaining({ monthlyAllowance: 1000, usedThisMonth: 2000, extraCredits: 0 })).toBe(0);
  });

  it("consume draws monthly pool first, then extras", async () => {
    const balance = {
      id: "b1",
      organizationId: "org1",
      monthlyAllowance: 1000,
      usedThisMonth: 800,
      extraCredits: 500,
      softLimitPct: 80,
      hardLimitPct: 100,
      periodStart: new Date(),
      periodEnd: null as Date | null,
    };

    vi.mocked(db.aICreditBalance.findUnique).mockResolvedValue(balance as never);
    vi.mocked(db.aICreditBalance.update).mockImplementation((async (args: { data: Record<string, unknown> }) => {
      const inc = args.data.usedThisMonth as { increment?: number; decrement?: number };
      const extra = args.data.extraCredits as { increment?: number; decrement?: number } | undefined;
      if (typeof inc === "number") balance.usedThisMonth = inc;
      else balance.usedThisMonth += (inc?.increment ?? 0) - (inc?.decrement ?? 0);
      if (extra) balance.extraCredits += (extra.increment ?? 0) - (extra.decrement ?? 0);
      return balance;
    }) as never);
    vi.mocked(db.aICreditTransaction.create).mockResolvedValue({ id: "tx1" } as never);

    const result = await consumeCredits("org1", 400, "usage1");
    expect(result.success).toBe(true);
    // 200 taken from the monthly pool (800->1200), 200 from extras
    // (500->300). Remaining total: 0 monthly + 300 extras.
    expect(result.remaining).toBe(300);
  });

  it("blocks consumption when total available is insufficient", async () => {
    const balance = {
      id: "b2",
      organizationId: "org1",
      monthlyAllowance: 100,
      usedThisMonth: 100,
      extraCredits: 0,
      softLimitPct: 80,
      hardLimitPct: 100,
      periodStart: new Date(),
      periodEnd: null as Date | null,
    };
    vi.mocked(db.aICreditBalance.findUnique).mockResolvedValue(balance as never);

    const result = await consumeCredits("org1", 50, "usage2");
    expect(result.success).toBe(false);
    expect(db.aICreditBalance.update).not.toHaveBeenCalled();
  });

  it("rejects requests once credits are exhausted", async () => {
    const exhausted = {
      id: "b3",
      organizationId: "org1",
      monthlyAllowance: 1000,
      usedThisMonth: 1000,
      extraCredits: 0,
      softLimitPct: 80,
      hardLimitPct: 100,
      periodStart: new Date(),
      periodEnd: null as Date | null,
    };
    vi.mocked(db.aICreditBalance.findUnique).mockResolvedValue(exhausted as never);

    const blocked = await checkCredits("org1");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("extras are preserved across renewals (allocate only resets monthly fields)", async () => {
    const existing = {
      id: "b4",
      organizationId: "org1",
      monthlyAllowance: 100_000,
      usedThisMonth: 90_000,
      extraCredits: 250_000,
      periodStart: new Date(),
      periodEnd: null as Date | null,
    };
    vi.mocked(db.aICreditBalance.findUnique).mockResolvedValue(existing as never);
    vi.mocked(db.aICreditBalance.update).mockResolvedValue({
      ...existing,
      monthlyAllowance: 500_000,
      usedThisMonth: 0,
    } as never);

    const { allocateMonthlyCredits } = await import("@/lib/ai-credits");
    await allocateMonthlyCredits({ organizationId: "org1", monthlyAllowance: AI_CREDITS_MONTHLY.standard });

    const call = vi.mocked(db.aICreditBalance.update).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(call.data.monthlyAllowance).toBe(500_000);
    expect(call.data.usedThisMonth).toBe(0);
    expect(call.data).not.toHaveProperty("extraCredits");
  });
});

// ─── 6. SUSPENDED Status & Lifecycle ──────────────────────────

describe("Phase 14 - SUSPENDED Status & Lifecycle", () => {
  it("includes SUSPENDED in the status enum", () => {
    expect(Object.values(SubscriptionStatus)).toContain("SUSPENDED");
    expect(getValidTransitions(SubscriptionStatus.SUSPENDED)).toContain(
      SubscriptionStatus.ACTIVE
    );
  });

  it("allows ACTIVE -> SUSPENDED (platform owner action)", () => {
    expect(canTransition(SubscriptionStatus.ACTIVE, SubscriptionStatus.SUSPENDED)).toBe(true);
  });

  it("allows PAST_DUE -> SUSPENDED", () => {
    expect(canTransition(SubscriptionStatus.PAST_DUE, SubscriptionStatus.SUSPENDED)).toBe(true);
  });

  it("allows SUSPENDED -> ACTIVE, EXPIRED or CANCELLED", () => {
    expect(canTransition(SubscriptionStatus.SUSPENDED, SubscriptionStatus.ACTIVE)).toBe(true);
    expect(canTransition(SubscriptionStatus.SUSPENDED, SubscriptionStatus.EXPIRED)).toBe(true);
    expect(canTransition(SubscriptionStatus.SUSPENDED, SubscriptionStatus.CANCELLED)).toBe(true);
  });

  it("forbids TRIAL -> SUSPENDED and SUSPENDED -> TRIAL", () => {
    expect(canTransition(SubscriptionStatus.TRIAL, SubscriptionStatus.SUSPENDED)).toBe(false);
    expect(canTransition(SubscriptionStatus.SUSPENDED, SubscriptionStatus.TRIAL)).toBe(false);
  });

  it("allows recovery from EXPIRED via renewal (EXPIRED -> ACTIVE)", () => {
    expect(canTransition(SubscriptionStatus.EXPIRED, SubscriptionStatus.ACTIVE)).toBe(true);
  });
});

// ─── 7. Expiration Enforcement ────────────────────────────────

function makeSub(overrides: Partial<{ status: string; currentPeriodEnd: Date | null }> = {}) {
  return {
    id: "sub1",
    planId: "plan1",
    organizationId: "org1",
    status: overrides.status ?? "ACTIVE",
    billingInterval: "MONTHLY",
    currentPeriodStart: new Date("2026-01-01"),
    currentPeriodEnd:
      overrides.currentPeriodEnd === undefined ? new Date(Date.now() + 86_400_000) : overrides.currentPeriodEnd,
    createdAt: new Date(),
  };
}

describe("Phase 14 - Expiration Enforcement", () => {
  it("ACTIVE within period grants access", async () => {
    vi.mocked(db.subscription.findFirst).mockResolvedValue(makeSub() as never);
    const state = await getSubscriptionState("org1");
    expect(state.state).toBe("ACTIVE");
    expect(state.hasAccess).toBe(true);
    expect(state.lapsed).toBe(false);
  });

  it("lapsed ACTIVE period is reported as EXPIRED without access", async () => {
    vi.mocked(db.subscription.findFirst).mockResolvedValue(
      makeSub({ currentPeriodEnd: new Date(Date.now() - 86_400_000) }) as never
    );
    const state = await getSubscriptionState("org1");
    expect(state.state).toBe("EXPIRED");
    expect(state.lapsed).toBe(true);
    expect(state.hasAccess).toBe(false);
  });

  it("EXPIRED status has no access", async () => {
    vi.mocked(db.subscription.findFirst).mockResolvedValue(makeSub({ status: "EXPIRED" }) as never);
    const state = await getSubscriptionState("org1");
    expect(state.state).toBe("EXPIRED");
    expect(state.hasAccess).toBe(false);
  });

  it("SUSPENDED has no access but is not marked lapsed", async () => {
    vi.mocked(db.subscription.findFirst).mockResolvedValue(makeSub({ status: "SUSPENDED" }) as never);
    const state = await getSubscriptionState("org1");
    expect(state.state).toBe("SUSPENDED");
    expect(state.hasAccess).toBe(false);
    expect(state.lapsed).toBe(false);
  });

  it("no subscription means no access", async () => {
    vi.mocked(db.subscription.findFirst).mockResolvedValue(null as never);
    const state = await getSubscriptionState("org1");
    expect(state.state).toBe("NONE");
    expect(state.hasAccess).toBe(false);
  });

  it("assertSubscriptionActive throws a French expired error", async () => {
    vi.mocked(db.subscription.findFirst).mockResolvedValue(makeSub({ status: "EXPIRED" }) as never);
    await expect(assertSubscriptionActive("org1")).rejects.toThrow(
      "Votre abonnement a expiré."
    );
  });

  it("expired errors map to HTTP 402", () => {
    const err = new SubscriptionInactiveError("EXPIRED");
    expect(billingErrorStatus(err)).toBe(402);
  });
});

// ─── 8. Tenant Isolation ──────────────────────────────────────

describe("Phase 14 - Tenant Isolation", () => {
  it("accepts a subscription owned by the organization", () => {
    const sub = makeSub();
    expect(assertSubscriptionOwnership(sub, "org1")).toBe(sub);
  });

  it("rejects another tenant's subscription", () => {
    const sub = makeSub();
    expect(() => assertSubscriptionOwnership(sub, "org-other")).toThrow(
      "Subscription does not belong to this organization"
    );
  });

  it("cross-tenant access attempts map to HTTP 403", () => {
    const sub = makeSub();
    try {
      assertSubscriptionOwnership(sub, "org-other");
      throw new Error("should have thrown");
    } catch (e) {
      expect(billingErrorStatus(e)).toBe(403);
    }
  });
});
