import { db } from "@/lib/prisma";
import { SubscriptionStatus } from "@/lib/constants";

const VALID_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  [SubscriptionStatus.TRIAL]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRED],
  [SubscriptionStatus.ACTIVE]: [SubscriptionStatus.PAST_DUE, SubscriptionStatus.CANCELLED, SubscriptionStatus.SUSPENDED, SubscriptionStatus.EXPIRED],
  [SubscriptionStatus.PAST_DUE]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED, SubscriptionStatus.SUSPENDED, SubscriptionStatus.EXPIRED],
  [SubscriptionStatus.CANCELLED]: [],
  [SubscriptionStatus.TRIALING]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRED],
  [SubscriptionStatus.EXPIRED]: [SubscriptionStatus.ACTIVE],
  [SubscriptionStatus.SUSPENDED]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED, SubscriptionStatus.EXPIRED],
};

export type TransitionResult = {
  success: boolean;
  previousStatus: SubscriptionStatus;
  newStatus?: SubscriptionStatus;
  error?: string;
};

export function canTransition(
  from: SubscriptionStatus,
  to: SubscriptionStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidTransitions(status: SubscriptionStatus): SubscriptionStatus[] {
  return VALID_TRANSITIONS[status] ?? [];
}

export async function transitionSubscription(
  subscriptionId: string,
  newStatus: SubscriptionStatus
): Promise<TransitionResult> {
  const subscription = await db.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    return {
      success: false,
      previousStatus: SubscriptionStatus.ACTIVE,
      error: "Subscription not found",
    };
  }

  const previousStatus = subscription.status as SubscriptionStatus;

  if (!canTransition(previousStatus, newStatus)) {
    return {
      success: false,
      previousStatus,
      error: `Cannot transition from ${previousStatus} to ${newStatus}`,
    };
  }

  const updateData: Record<string, unknown> = { status: newStatus };

  if (newStatus === SubscriptionStatus.ACTIVE && previousStatus === SubscriptionStatus.PAST_DUE) {
    updateData.trialEndsAt = null;
  }

  const updated = await db.subscription.update({
    where: { id: subscriptionId },
    data: updateData,
  });

  return {
    success: true,
    previousStatus,
    newStatus: updated.status as SubscriptionStatus,
  };
}

export async function createTrialSubscription(
  organizationId: string,
  planId: string,
  trialDays: number = 14
): Promise<SubscriptionStatus> {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

  const existing = await db.subscription.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  if (existing && [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL].includes(existing.status as SubscriptionStatus)) {
    return existing.status as SubscriptionStatus;
  }

  await db.subscription.create({
    data: {
      organizationId,
      planId,
      status: SubscriptionStatus.TRIAL,
      startDate: now,
      trialEndsAt: trialEnd,
    },
  });

  return SubscriptionStatus.TRIAL;
}

export async function activateSubscription(subscriptionId: string): Promise<TransitionResult> {
  return transitionSubscription(subscriptionId, SubscriptionStatus.ACTIVE);
}

export async function cancelSubscription(subscriptionId: string): Promise<TransitionResult> {
  return transitionSubscription(subscriptionId, SubscriptionStatus.CANCELLED);
}
