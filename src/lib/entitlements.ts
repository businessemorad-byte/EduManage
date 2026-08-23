import { db } from "@/lib/prisma";
import { SubscriptionStatus, type FeatureKey } from "@/lib/constants";

export type Entitlement = {
  featureKey: FeatureKey;
  isEnabled: boolean;
  limit: number | null;
  usage: number | null;
  hasRemaining: boolean;
};

export type EntitlementResult = {
  active: boolean;
  planName: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  entitlements: Entitlement[];
};

export async function resolveEntitlements(
  organizationId: string
): Promise<EntitlementResult> {
  const subscription = await db.subscription.findFirst({
    where: { organizationId },
    include: {
      plan: {
        include: {
          features: {
            include: { feature: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    return {
      active: false,
      planName: null,
      subscriptionStatus: null,
      entitlements: [],
    };
  }

  const isActive = [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.TRIAL,
    SubscriptionStatus.TRIALING,
  ].includes(subscription.status as SubscriptionStatus);

  const entitlements: Entitlement[] = subscription.plan.features.map((pf) => ({
    featureKey: pf.feature.key as FeatureKey,
    isEnabled: pf.isEnabled,
    limit: pf.limit,
    usage: null,
    hasRemaining: pf.limit === null || pf.limit > 0,
  }));

  return {
    active: isActive,
    planName: subscription.plan.name,
    subscriptionStatus: subscription.status as SubscriptionStatus,
    entitlements,
  };
}

export async function hasEntitlement(
  organizationId: string,
  featureKey: FeatureKey
): Promise<boolean> {
  const result = await resolveEntitlements(organizationId);
  if (!result.active) return false;

  const entitlement = result.entitlements.find(
    (e) => e.featureKey === featureKey
  );

  return entitlement?.isEnabled ?? false;
}

export async function getEntitlementLimit(
  organizationId: string,
  featureKey: FeatureKey
): Promise<number | null> {
  const result = await resolveEntitlements(organizationId);
  if (!result.active) return null;

  const entitlement = result.entitlements.find(
    (e) => e.featureKey === featureKey
  );

  if (!entitlement?.isEnabled) return null;
  return entitlement.limit;
}

export async function checkUsageLimit(
  organizationId: string,
  featureKey: FeatureKey,
  currentUsage: number
): Promise<{ allowed: boolean; limit: number | null; remaining: number | null }> {
  const limit = await getEntitlementLimit(organizationId, featureKey);

  if (limit === null) {
    return { allowed: true, limit: null, remaining: null };
  }

  const remaining = limit - currentUsage;

  return {
    allowed: remaining > 0,
    limit,
    remaining: Math.max(0, remaining),
  };
}
