import { db } from "@/lib/prisma";

// ─── Types ──────────────────────────────────────────────────────

export type PlanCreate = {
  name: string;
  code: string;
  displayName: string;
  description?: string;
  priceMonthly?: number;
  priceYearly?: number;
  currency?: string;
  trialDurationDays?: number;
  sortOrder?: number;
};

export type PlanUpdate = Partial<Omit<PlanCreate, "code">> & { isActive?: boolean };

// ─── CRUD ──────────────────────────────────────────────────────

export async function createPlan(data: PlanCreate) {
  return db.plan.create({
    data: {
      name: data.name,
      code: data.code,
      displayName: data.displayName,
      description: data.description ?? null,
      priceMonthly: data.priceMonthly ?? null,
      priceYearly: data.priceYearly ?? null,
      currency: data.currency ?? "USD",
      trialDurationDays: data.trialDurationDays ?? 14,
      sortOrder: data.sortOrder ?? 0,
    },
    include: { features: { include: { feature: true } } },
  });
}

export async function updatePlan(id: string, data: PlanUpdate) {
  return db.plan.update({ where: { id }, data });
}

export async function getPlan(id: string) {
  return db.plan.findUnique({
    where: { id },
    include: { features: { include: { feature: true } } },
  });
}

export async function getPlanByCode(code: string) {
  return db.plan.findUnique({
    where: { code },
    include: { features: { include: { feature: true } } },
  });
}

export async function listPlans(includeInactive = false) {
  return db.plan.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: { features: { include: { feature: true } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function archivePlan(id: string) {
  return db.plan.update({ where: { id }, data: { isActive: false, status: "ARCHIVED" } });
}

// ─── Plan Features ─────────────────────────────────────────────

export async function setPlanFeatures(planId: string, features: Array<{ featureKey: string; isEnabled?: boolean; limit?: number | null }>) {
  for (const f of features) {
    const feature = await db.feature.upsert({
      where: { key: f.featureKey },
      update: {},
      create: { key: f.featureKey, displayName: f.featureKey },
    });

    await db.planFeature.upsert({
      where: { planId_featureId: { planId, featureId: feature.id } },
      update: { isEnabled: f.isEnabled ?? true, limit: f.limit ?? null },
      create: { planId, featureId: feature.id, isEnabled: f.isEnabled ?? true, limit: f.limit ?? null },
    });
  }
}

// ─── Price Calculation ─────────────────────────────────────────

export function calculatePrice(plan: { priceMonthly: unknown; priceYearly: unknown }, interval: string): number {
  if (interval === "YEARLY") {
    // priceYearly is the total annual amount billed once (e.g. 6990 for
    // a 699/month plan), never a per-month unit price. The UI and
    // billing-config treat it as the annual total, so return it as-is.
    return Number(plan.priceYearly ?? plan.priceMonthly);
  }
  return Number(plan.priceMonthly ?? 0);
}

export function calculateMonthlyPrice(plan: { priceMonthly: unknown; priceYearly: unknown }, interval: string): number {
  if (interval === "YEARLY") {
    const yearly = Number(plan.priceYearly ?? plan.priceMonthly);
    return yearly / 12;
  }
  return Number(plan.priceMonthly ?? 0);
}
