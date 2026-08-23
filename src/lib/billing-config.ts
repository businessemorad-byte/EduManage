// ─── Centralized Billing Configuration ─────────────────────────
// Single source of truth for all pricing, promotions and AI credits.
// The platform owner can override promo/AI settings at runtime via
// the PlatformConfig record (see src/lib/billing/platform-config.ts);
// these values are the defaults shipped with the platform.

import { OrganizationType } from "@/lib/constants";

export type PlanTierSlug = "starter" | "standard" | "pro" | "ultimate" | "custom";

export type BillingInterval = "MONTHLY" | "YEARLY";

export type TierPrice = {
  priceMonthly: number; // MAD / month
  priceYearly: number; // MAD / year (billed once)
};

export type OrgTypeBillingConfig = {
  tiers: Record<Exclude<PlanTierSlug, "custom">, TierPrice>;
};

// ─── Final plan pricing (MAD) ─────────────────────────────────

export const PLAN_PRICING: Record<OrganizationType, OrgTypeBillingConfig> = {
  [OrganizationType.PRIVATE_SCHOOL]: {
    tiers: {
      starter: { priceMonthly: 699, priceYearly: 6990 },
      standard: { priceMonthly: 1499, priceYearly: 14990 },
      pro: { priceMonthly: 2499, priceYearly: 24990 },
      ultimate: { priceMonthly: 4999, priceYearly: 49990 },
    },
  },
  [OrganizationType.SUPPORT_CENTER]: {
    tiers: {
      starter: { priceMonthly: 499, priceYearly: 4990 },
      standard: { priceMonthly: 1199, priceYearly: 11990 },
      pro: { priceMonthly: 1999, priceYearly: 19990 },
      ultimate: { priceMonthly: 3499, priceYearly: 34990 },
    },
  },
  [OrganizationType.TRAINING_CENTER]: {
    tiers: {
      starter: { priceMonthly: 699, priceYearly: 6990 },
      standard: { priceMonthly: 1499, priceYearly: 14990 },
      pro: { priceMonthly: 2499, priceYearly: 24990 },
      ultimate: { priceMonthly: 4499, priceYearly: 44990 },
    },
  },
};

// ─── Promotions ────────────────────────────────────────────────

export const PROMOTION_CONFIG = {
  // FIRST MONTH = 50% OFF (replaces the previous "1 month free" offer).
  firstMonthDiscountPct: 50,
  active: true,
  label: "-50% sur le 1er mois",
} as const;

// Annual billing: yearly price = monthly × ANNUAL_BILLED_MONTHS.
// 10 months => ~2 months free. Configurable from this single place.
export const ANNUAL_BILLING_CONFIG = {
  billedMonths: 10,
} as const;

// ─── Included AI credits (per billing month) ──────────────────

export const AI_CREDITS_MONTHLY: Record<
  Exclude<PlanTierSlug, "custom">,
  number
> = {
  starter: 100_000,
  standard: 500_000,
  pro: 1_000_000,
  ultimate: 5_000_000,
};

// Custom plans have negotiated AI credits.
export const AI_CREDITS_CUSTOM = null;

// ─── Extra AI credit packages (one-time purchase) ─────────────

export type CreditPackage = {
  id: string;
  credits: number;
  priceMad: number;
  label: string;
};

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "credits_100k", credits: 100_000, priceMad: 99, label: "100k crédits" },
  { id: "credits_500k", credits: 500_000, priceMad: 399, label: "500k crédits" },
  { id: "credits_1m", credits: 1_000_000, priceMad: 699, label: "1M crédits" },
  { id: "credits_5m", credits: 5_000_000, priceMad: 1199, label: "5M crédits" },
];

export function getCreditPackage(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((p) => p.id === packageId);
}

// ─── Helpers ───────────────────────────────────────────────────

export function getTierPricing(
  orgType: OrganizationType,
  tier: PlanTierSlug
): TierPrice | null {
  if (tier === "custom") return null;
  return PLAN_PRICING[orgType]?.tiers[tier] ?? null;
}

export function computeAnnualPrice(priceMonthly: number): number {
  return priceMonthly * ANNUAL_BILLING_CONFIG.billedMonths;
}

export function computeAnnualSavings(priceMonthly: number): number {
  return priceMonthly * 12 - computeAnnualPrice(priceMonthly);
}

export function computeFirstMonthPrice(priceMonthly: number): number {
  if (!PROMOTION_CONFIG.active) return priceMonthly;
  return Math.round(
    priceMonthly * (1 - PROMOTION_CONFIG.firstMonthDiscountPct / 100) * 100
  ) / 100;
}

export function getPriceForInterval(
  orgType: OrganizationType,
  tier: PlanTierSlug,
  interval: BillingInterval
): number | null {
  const pricing = getTierPricing(orgType, tier);
  if (!pricing) return null;
  return interval === "YEARLY" ? pricing.priceYearly : pricing.priceMonthly;
}

export function formatMAD(amount: number): string {
  return amount.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

// ─── Plan-code helpers ─────────────────────────────────────────
// DB plans use codes like "PS_STARTER", "SC_PRO", "TC_ULTIMATE".
// The tier keyword is matched anywhere in the code so custom codes
// keep working as long as they mention the tier.

const TIER_KEYWORDS: Array<{ tier: Exclude<PlanTierSlug, "custom">; pattern: RegExp }> = [
  { tier: "starter", pattern: /STARTER/i },
  { tier: "standard", pattern: /STANDARD/i },
  { tier: "pro", pattern: /(^|[^A-Z])PRO([^A-Z]|$)/i },
  { tier: "ultimate", pattern: /ULTIMATE/i },
];

export function getTierFromPlanCode(code: string): PlanTierSlug {
  for (const { tier, pattern } of TIER_KEYWORDS) {
    if (pattern.test(code)) return tier;
  }
  return "custom";
}

/** Included monthly AI credits for a DB plan row (by its code). */
export function getIncludedCreditsForPlanCode(code: string): number | null {
  const tier = getTierFromPlanCode(code);
  if (tier === "custom") return null;
  return AI_CREDITS_MONTHLY[tier];
}
