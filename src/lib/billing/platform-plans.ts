import { getIncludedCreditsForPlanCode } from "@/lib/billing-config";

// ─── Platform Plan DTO ─────────────────────────────────────────
// Shared, stable contract between /api/platform/billing/plans and
// the platform billing UI. DB `Plan` rows are serialized through
// this mapper so the client never touches raw Prisma rows (which
// lack display fields like aiCreditsMonthly / priceMonthlyMad).

export type PlatformPlan = {
  id: string;
  code: string;
  displayName: string;
  /** Derived from the plan-code prefix (PS_/SC_/TC_) when present. */
  orgTypeKey: string | null;
  priceMonthlyMad: number | null;
  priceYearlyMad: number | null;
  /** Included monthly AI credits derived from the plan tier. */
  aiCreditsMonthly: number | null;
  isActive: boolean;
  sortOrder: number;
  status: string;
};

type PlanRow = {
  id: string;
  code: string;
  displayName: string;
  priceMonthly: unknown;
  priceYearly: unknown;
  isActive: boolean;
  sortOrder: number;
  status: string;
};

// Code prefixes used by org-scoped plan codes (e.g. "PS_STARTER").
const ORG_TYPE_PREFIXES: Record<string, string> = {
  PS: "PRIVATE_SCHOOL",
  SC: "SUPPORT_CENTER",
  TC: "TRAINING_CENTER",
};

export function orgTypeKeyFromPlanCode(code: string): string | null {
  const prefix = code.split("_")[0].toUpperCase();
  return ORG_TYPE_PREFIXES[prefix] ?? null;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function serializePlatformPlan(plan: PlanRow): PlatformPlan {
  return {
    id: plan.id,
    code: plan.code,
    displayName: plan.displayName,
    orgTypeKey: orgTypeKeyFromPlanCode(plan.code),
    priceMonthlyMad: toNullableNumber(plan.priceMonthly),
    priceYearlyMad: toNullableNumber(plan.priceYearly),
    aiCreditsMonthly: getIncludedCreditsForPlanCode(plan.code),
    isActive: plan.isActive,
    sortOrder: plan.sortOrder,
    status: plan.status,
  };
}

// ─── PATCH payload parsing (used by the platform route) ────────
// Maps the client DTO fields back onto the DB `Plan` fields with a
// strict whitelist. `priceMonthlyMad` / `priceYearlyMad` may be set
// to null to clear a "sur devis" price.

export type PlanPatchResult =
  | { ok: true; planId: string; data: Record<string, unknown> }
  | { ok: false; error: string };

export function parsePlatformPlanPatch(body: unknown): PlanPatchResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid body" };
  }
  const b = body as Record<string, unknown>;
  const planId = typeof b.planId === "string" && b.planId ? b.planId : undefined;
  if (!planId) return { ok: false, error: "planId required" };

  const data: Record<string, unknown> = {};

  if (b.displayName !== undefined) data.displayName = String(b.displayName);
  if (b.description !== undefined) data.description = String(b.description);
  if (b.isActive !== undefined) data.isActive = Boolean(b.isActive);

  if (b.sortOrder !== undefined) {
    const n = Number(b.sortOrder);
    if (!Number.isFinite(n)) {
      return { ok: false, error: "sortOrder must be a number" };
    }
    data.sortOrder = n;
  }

  if (b.priceMonthlyMad !== undefined) {
    if (b.priceMonthlyMad === null) {
      data.priceMonthly = null;
    } else {
      const n = Number(b.priceMonthlyMad);
      if (!Number.isFinite(n) || n < 0) {
        return { ok: false, error: "priceMonthlyMad must be a non-negative number" };
      }
      data.priceMonthly = n;
    }
  }

  if (b.priceYearlyMad !== undefined) {
    if (b.priceYearlyMad === null) {
      data.priceYearly = null;
    } else {
      const n = Number(b.priceYearlyMad);
      if (!Number.isFinite(n) || n < 0) {
        return { ok: false, error: "priceYearlyMad must be a non-negative number" };
      }
      data.priceYearly = n;
    }
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: "No valid fields to update" };
  }

  return { ok: true, planId, data };
}

// ─── Frontend-safe formatting ──────────────────────────────────
// Shared helper so missing/null numeric values render "—" instead
// of throwing on toLocaleString.

export function formatPlanAmount(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}