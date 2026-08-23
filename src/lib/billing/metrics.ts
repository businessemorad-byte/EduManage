import { db } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/client";

// ─── MRR Calculation ─────────────────────────────────────────

export async function calculateMRR(): Promise<{ mrr: number; count: number }> {
  const activeSubs = await db.subscription.findMany({
    where: { status: { in: ["ACTIVE", "PAST_DUE"] } },
    include: { plan: true },
  });

  let mrr = new Decimal(0);
  for (const sub of activeSubs) {
    const monthly = sub.billingInterval === "YEARLY"
      ? (sub.plan.priceYearly ?? sub.plan.priceMonthly ?? new Decimal(0)).div(12)
      : (sub.plan.priceMonthly ?? new Decimal(0));
    mrr = mrr.add(monthly);
  }

  return { mrr: Number(mrr.toFixed(2)), count: activeSubs.length };
}

// ─── ARR Calculation ─────────────────────────────────────────

export async function calculateARR(): Promise<{ arr: number; count: number }> {
  const mrr = await calculateMRR();
  return { arr: Math.round(mrr.mrr * 12 * 100) / 100, count: mrr.count };
}

// ─── Churn Rate ──────────────────────────────────────────────

export async function calculateChurnRate(months = 1): Promise<{
  churnRate: number;
  canceledCount: number;
  totalStartCount: number;
}> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth() - months, 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalStart = await db.subscription.count({
    where: { createdAt: { lt: periodStart }, status: { notIn: ["CANCELLED", "EXPIRED"] } },
  });

  const canceled = await db.subscription.count({
    where: {
      status: { in: ["CANCELLED", "EXPIRED"] },
      updatedAt: { gte: periodStart, lt: periodEnd },
    },
  });

  return {
    churnRate: totalStart > 0 ? Math.round((canceled / totalStart) * 10000) / 100 : 0,
    canceledCount: canceled,
    totalStartCount: totalStart,
  };
}

// ─── Retention ───────────────────────────────────────────────

export async function calculateRetention() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const [totalOrgs, activeSubs, newOrgs, churned] = await Promise.all([
    db.organization.count({ where: { isActive: true } }),
    db.subscription.count({ where: { status: { in: ["ACTIVE", "TRIAL", "TRIALING"] } } }),
    db.organization.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.subscription.count({
      where: { status: { in: ["CANCELLED", "EXPIRED"] }, updatedAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  return {
    totalOrganizations: totalOrgs,
    activeSubscriptions: activeSubs,
    newOrganizations: newOrgs,
    churnedOrganizations: churned,
    retentionRate: totalOrgs > 0 ? Math.round(((totalOrgs - churned) / totalOrgs) * 10000) / 100 : 100,
  };
}

// ─── Billing Dashboard (Platform Admin) ──────────────────────

export async function getPlatformBillingMetrics() {
  const [mrr, arr, churn, retention, planDistribution] = await Promise.all([
    calculateMRR(),
    calculateARR(),
    calculateChurnRate(),
    calculateRetention(),
    db.subscription.groupBy({ by: ["planId", "status"], _count: true }),
  ]);

  const failedPayments = await db.billingPayment.count({ where: { status: "FAILED" } });
  const pastDue = await db.subscription.count({ where: { status: "PAST_DUE" } });
  const trialing = await db.subscription.count({ where: { status: { in: ["TRIAL", "TRIALING"] } } });

  return {
    mrr: mrr.mrr,
    arr: arr.arr,
    activeSubscriptions: mrr.count,
    trialing,
    pastDue,
    failedPayments,
    churnRate: churn.churnRate,
    retention: retention.retentionRate,
    planDistribution,
  };
}

// ─── Billing History ─────────────────────────────────────────

export async function getBillingHistory(organizationId: string, params?: { limit?: number; offset?: number }) {
  const [invoices, payments] = await Promise.all([
    db.billingInvoice.findMany({
      where: { organizationId },
      include: { items: true, payments: true },
      orderBy: { issuedAt: "desc" },
      take: params?.limit ?? 20,
      skip: params?.offset ?? 0,
    }),
    db.billingPayment.findMany({
      where: { organizationId },
      include: { invoice: { select: { invoiceNumber: true } } },
      orderBy: { createdAt: "desc" },
      take: params?.limit ?? 20,
      skip: params?.offset ?? 0,
    }),
  ]);

  return { invoices, payments };
}
