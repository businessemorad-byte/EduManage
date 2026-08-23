import { db } from "@/lib/prisma";
import { SubscriptionStatus } from "@/lib/constants";
import { emitEvent, audit, EVENT_TYPES } from "@/lib/events";
import { canTransition } from "@/lib/subscription";
import { getIncludedCreditsForPlanCode, type BillingInterval } from "@/lib/billing-config";
import { allocateMonthlyCredits } from "@/lib/ai-credits";

// ─── Period Helpers ────────────────────────────────────────────

export function computePeriodEnd(start: Date, interval: BillingInterval | string): Date {
  if (interval === "YEARLY") {
    return new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
  }
  return new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
}

/**
 * Allocates the plan's included AI credits for the current period.
 * Purchased extra credits are never touched.
 */
async function allocatePlanCredits(organizationId: string, planId: string, periodStart: Date, periodEnd: Date) {
  const plan = await db.plan.findUnique({ where: { id: planId } });
  const credits = plan ? getIncludedCreditsForPlanCode(plan.code) : null;
  if (credits === null) return;
  await allocateMonthlyCredits({
    organizationId,
    monthlyAllowance: credits,
    periodStart,
    periodEnd,
  });
}

// ─── Create Subscription ───────────────────────────────────────

export async function createSubscription(params: {
  organizationId: string;
  planId: string;
  billingInterval?: string;
  trialDays?: number;
  couponId?: string;
}) {
  const existing = await db.subscription.findFirst({
    where: { organizationId: params.organizationId, status: { in: ["ACTIVE", "TRIAL", "TRIALING"] } },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    throw new Error("Organization already has an active subscription");
  }

  const now = new Date();
  const trialEnds = params.trialDays && params.trialDays > 0
    ? new Date(now.getTime() + params.trialDays * 86400000)
    : null;
  const periodEnd = params.billingInterval === "YEARLY"
    ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
    : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const sub = await db.subscription.create({
    data: {
      organizationId: params.organizationId,
      planId: params.planId,
      status: trialEnds ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE,
      billingInterval: params.billingInterval ?? "MONTHLY",
      startDate: now,
      trialEndsAt: trialEnds,
      currentPeriodStart: now,
      currentPeriodEnd: trialEnds ?? periodEnd,
    },
    include: { plan: true },
  });

  await emitEvent({ type: EVENT_TYPES.BILLING_SUBSCRIPTION_CREATED, organizationId: params.organizationId, payload: { subscriptionId: sub.id, planId: params.planId } });
  await audit({ organizationId: params.organizationId, action: "subscription.created", resource: "Subscription", resourceId: sub.id });

  return sub;
}

// ─── Activate Subscription (after payment) ────────────────────

export async function activateSubscription(subscriptionId: string, providerRef?: string) {
  const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw new Error("Subscription not found");

  const prevStatus = sub.status as SubscriptionStatus;
  if (!canTransition(prevStatus, SubscriptionStatus.ACTIVE)) {
    throw new Error(`Cannot activate from ${prevStatus}`);
  }

  const now = new Date();
  const periodEnd = computePeriodEnd(now, sub.billingInterval);

  const updated = await db.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: SubscriptionStatus.ACTIVE,
      trialEndsAt: null,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      providerRef: providerRef ?? sub.providerRef,
    },
    include: { plan: true },
  });

  await allocatePlanCredits(sub.organizationId, sub.planId, now, periodEnd);

  await emitEvent({ type: EVENT_TYPES.BILLING_SUBSCRIPTION_ACTIVATED, organizationId: sub.organizationId, payload: { subscriptionId } });
  await audit({ organizationId: sub.organizationId, action: "subscription.activated", resource: "Subscription", resourceId: subscriptionId });

  return updated;
}

// ─── Upgrade ──────────────────────────────────────────────────

export async function upgradeSubscription(subscriptionId: string, newPlanId: string) {
  const sub = await db.subscription.findUnique({ where: { id: subscriptionId }, include: { plan: true } });
  if (!sub) throw new Error("Subscription not found");
  if (sub.status !== SubscriptionStatus.ACTIVE) throw new Error("Subscription must be active to upgrade");

  const newPlan = await db.plan.findUnique({ where: { id: newPlanId } });
  if (!newPlan) throw new Error("Target plan not found");
  if (!newPlan.isActive) throw new Error("Target plan is not active");

  const oldPlan = sub.plan;
  const isUpgrade = (newPlan.sortOrder > oldPlan.sortOrder) || Number(newPlan.priceMonthly ?? 0) > Number(oldPlan.priceMonthly ?? 0);

  if (!isUpgrade) {
    throw new Error("This is not an upgrade. Use downgrade instead.");
  }

  const updated = await db.subscription.update({
    where: { id: subscriptionId },
    data: { planId: newPlanId },
    include: { plan: true },
  });

  await emitEvent({ type: EVENT_TYPES.BILLING_SUBSCRIPTION_UPGRADED, organizationId: sub.organizationId, payload: { subscriptionId, fromPlanId: oldPlan.id, toPlanId: newPlanId } });
  await audit({ organizationId: sub.organizationId, action: "subscription.upgraded", resource: "Subscription", resourceId: subscriptionId, metadata: { fromPlan: oldPlan.name, toPlan: newPlan.name } });

  return updated;
}

// ─── Downgrade ────────────────────────────────────────────────

export async function downgradeSubscription(subscriptionId: string, newPlanId: string) {
  const sub = await db.subscription.findUnique({ where: { id: subscriptionId }, include: { plan: true } });
  if (!sub) throw new Error("Subscription not found");
  if (sub.status !== SubscriptionStatus.ACTIVE) throw new Error("Subscription must be active to downgrade");

  const newPlan = await db.plan.findUnique({ where: { id: newPlanId } });
  if (!newPlan) throw new Error("Target plan not found");

  const isDowngrade = (newPlan.sortOrder < sub.plan.sortOrder) || Number(newPlan.priceMonthly ?? 0) < Number(sub.plan.priceMonthly ?? 0);

  if (!isDowngrade) {
    throw new Error("This is not a downgrade. Use upgrade instead.");
  }

  const updated = await db.subscription.update({
    where: { id: subscriptionId },
    data: { planId: newPlanId },
    include: { plan: true },
  });

  await emitEvent({ type: EVENT_TYPES.BILLING_SUBSCRIPTION_DOWNGRADED, organizationId: sub.organizationId, payload: { subscriptionId, fromPlanId: sub.planId, toPlanId: newPlanId } });
  await audit({ organizationId: sub.organizationId, action: "subscription.downgraded", resource: "Subscription", resourceId: subscriptionId });

  return updated;
}

// ─── Cancel ───────────────────────────────────────────────────

export async function cancelSubscription(subscriptionId: string, atPeriodEnd = true, reason?: string) {
  const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw new Error("Subscription not found");

  if (atPeriodEnd) {
    return db.subscription.update({
      where: { id: subscriptionId },
      data: { cancelAtPeriodEnd: true, cancelReason: reason ?? null },
    });
  }

  if (!canTransition(sub.status as SubscriptionStatus, SubscriptionStatus.CANCELLED)) {
    throw new Error(`Cannot cancel from ${sub.status}`);
  }

  const updated = await db.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: SubscriptionStatus.CANCELLED,
      canceledAt: new Date(),
      cancelReason: reason ?? null,
      endDate: new Date(),
    },
  });

  await emitEvent({ type: EVENT_TYPES.BILLING_SUBSCRIPTION_CANCELED, organizationId: sub.organizationId, payload: { subscriptionId, reason } });
  await audit({ organizationId: sub.organizationId, action: "subscription.canceled", resource: "Subscription", resourceId: subscriptionId, metadata: { reason } });

  return updated;
}

// ─── Reactivate ───────────────────────────────────────────────

export async function reactivateSubscription(subscriptionId: string) {
  const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw new Error("Subscription not found");

  if (sub.status === SubscriptionStatus.CANCELLED || sub.status === SubscriptionStatus.EXPIRED) {
    throw new Error("Cannot reactivate a canceled or expired subscription. Create a new one.");
  }

  const updated = await db.subscription.update({
    where: { id: subscriptionId },
    data: { cancelAtPeriodEnd: false, cancelReason: null },
  });

  await audit({ organizationId: sub.organizationId, action: "subscription.reactivated", resource: "Subscription", resourceId: subscriptionId });
  return updated;
}

// ─── Trial Expiration ─────────────────────────────────────────

export async function expireTrial(subscriptionId: string) {
  const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw new Error("Subscription not found");

  if (sub.status !== SubscriptionStatus.TRIAL && sub.status !== SubscriptionStatus.TRIALING) {
    throw new Error("Subscription is not in trial status");
  }

  const updated = await db.subscription.update({
    where: { id: subscriptionId },
    data: { status: SubscriptionStatus.EXPIRED, endDate: new Date() },
  });

  await emitEvent({ type: EVENT_TYPES.BILLING_SUBSCRIPTION_EXPIRED, organizationId: sub.organizationId, payload: { subscriptionId } });
  await audit({ organizationId: sub.organizationId, action: "subscription.expired", resource: "Subscription", resourceId: subscriptionId });

  return updated;
}

// ─── Past Due ─────────────────────────────────────────────────

export async function markPastDue(subscriptionId: string) {
  const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw new Error("Subscription not found");

  if (!canTransition(sub.status as SubscriptionStatus, SubscriptionStatus.PAST_DUE)) {
    throw new Error(`Cannot mark past due from ${sub.status}`);
  }

  const updated = await db.subscription.update({
    where: { id: subscriptionId },
    data: { status: SubscriptionStatus.PAST_DUE },
  });

  await emitEvent({ type: EVENT_TYPES.BILLING_SUBSCRIPTION_PAST_DUE, organizationId: sub.organizationId, payload: { subscriptionId } });
  return updated;
}

// ─── Suspend / Unsuspend ──────────────────────────────────────

export async function suspendSubscription(subscriptionId: string, reason?: string) {
  const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw new Error("Subscription not found");

  if (!canTransition(sub.status as SubscriptionStatus, SubscriptionStatus.SUSPENDED)) {
    throw new Error(`Cannot suspend from ${sub.status}`);
  }

  const updated = await db.subscription.update({
    where: { id: subscriptionId },
    data: { status: SubscriptionStatus.SUSPENDED, cancelReason: reason ?? null },
  });

  await audit({ organizationId: sub.organizationId, action: "subscription.suspended", resource: "Subscription", resourceId: subscriptionId, metadata: { reason } });
  return updated;
}

// ─── Renew Period ─────────────────────────────────────────────

/**
 * Starts a new paid period. Allowed from ACTIVE (auto-renewal),
 * PAST_DUE (recovery) and EXPIRED (customer renews after expiry).
 */
export async function renewSubscription(subscriptionId: string) {
  const sub = await db.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true },
  });
  if (!sub) throw new Error("Subscription not found");

  const from = sub.status as SubscriptionStatus;
  const renewable = [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.PAST_DUE,
    SubscriptionStatus.EXPIRED,
    SubscriptionStatus.SUSPENDED,
  ];
  if (!renewable.includes(from)) {
    throw new Error(`Cannot renew from ${from}`);
  }

  const now = new Date();
  const periodEnd = computePeriodEnd(now, sub.billingInterval);

  const updated = await db.subscription.update({
    where: { id: subscriptionId },
    data: {
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      status: SubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: false,
      endDate: null,
    },
    include: { plan: true },
  });

  await allocatePlanCredits(sub.organizationId, sub.planId, now, periodEnd);

  await emitEvent({ type: EVENT_TYPES.BILLING_SUBSCRIPTION_ACTIVATED, organizationId: sub.organizationId, payload: { subscriptionId, renewed: true } });
  await audit({ organizationId: sub.organizationId, action: "subscription.renewed", resource: "Subscription", resourceId: subscriptionId });

  return updated;
}

// ─── Queries ──────────────────────────────────────────────────

export async function getOrganizationSubscription(organizationId: string) {
  // Latest subscription regardless of status so callers can render
  // expired/cancelled states; access decisions use the enforcement lib.
  return db.subscription.findFirst({
    where: { organizationId },
    include: { plan: { include: { features: { include: { feature: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function listSubscriptions(params?: { status?: string; planId?: string }) {
  return db.subscription.findMany({
    where: {
      ...(params?.status ? { status: params.status as SubscriptionStatus } : {}),
      ...(params?.planId ? { planId: params.planId } : {}),
    },
    include: { plan: true, organization: { select: { id: true, name: true, slug: true, type: true } } },
    orderBy: { createdAt: "desc" },
  });
}
