import { db } from "@/lib/prisma";
import { SubscriptionStatus, FeatureKey } from "@/lib/constants";
import { hasEntitlement } from "@/lib/entitlements";

// ─── Subscription Enforcement ──────────────────────────────────
// Server-side gating for paid functionality. Expired/cancelled
// subscriptions restrict paid features but NEVER delete data.

export type SubscriptionState = {
  state: "NONE" | "TRIAL" | "ACTIVE" | "PAST_DUE" | "EXPIRED" | "CANCELLED" | "SUSPENDED";
  subscription: {
    id: string;
    planId: string;
    status: string;
    billingInterval: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
  } | null;
  /** True when the organization may use paid functionality */
  hasAccess: boolean;
  /** True when period end has passed but status was not yet updated */
  lapsed: boolean;
};

const ACCESS_STATUSES: string[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIAL,
  SubscriptionStatus.TRIALING,
];

export async function getSubscriptionState(organizationId: string): Promise<SubscriptionState> {
  const sub = await db.subscription.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  if (!sub) {
    return { state: "NONE", subscription: null, hasAccess: false, lapsed: false };
  }

  // A period that has ended without renewal means the subscription
  // is no longer usable, regardless of the stored status.
  const now = new Date();
  const isActiveStatus = ACCESS_STATUSES.includes(sub.status);
  const lapsed = isActiveStatus && sub.currentPeriodEnd !== null && now > sub.currentPeriodEnd;

  if (lapsed) {
    return {
      state: "EXPIRED",
      subscription: sub,
      hasAccess: false,
      lapsed: true,
    };
  }

  return {
    state: (sub.status as SubscriptionState["state"]) ?? "NONE",
    subscription: sub,
    hasAccess: isActiveStatus,
    lapsed,
  };
}

/** Throws when the organization may not use paid functionality. */
export async function assertSubscriptionActive(organizationId: string): Promise<SubscriptionState> {
  const result = await getSubscriptionState(organizationId);
  if (!result.hasAccess) {
    throw new SubscriptionInactiveError(result.state);
  }
  return result;
}

/** Verifies a subscription belongs to the given organization (tenant isolation). */
export function assertSubscriptionOwnership<T extends { organizationId: string }>(
  subscription: T | null,
  organizationId: string
): T {
  if (!subscription || subscription.organizationId !== organizationId) {
    throw new Error("Subscription does not belong to this organization");
  }
  return subscription;
}

export class SubscriptionInactiveError extends Error {
  code = "SUBSCRIPTION_INACTIVE";
  constructor(public currentState: string) {
    super(
      currentState === "EXPIRED"
        ? "Votre abonnement a expiré."
        : "Aucun abonnement actif."
    );
  }
}

/** Maps an error thrown by enforcement helpers to an HTTP status. */
export function billingErrorStatus(error: unknown): number | null {
  if (error instanceof SubscriptionInactiveError) return 402; // Payment Required
  if (
    error instanceof Error &&
    error.message === "Subscription does not belong to this organization"
  ) {
    return 403;
  }
  return null;
}

// ─── Server-side plan gating ────────────────────────────────────
// Single entry point for API routes that must refuse service when
// the subscription expired or the plan does not include a feature.
// Returns an HTTP-ready payload so routes can render the clean
// "Upgrade" experience instead of leaking raw errors.

export type PaidAccessFailure = {
  ok: false;
  status: number;
  payload: {
    error: string;
    code: "SUBSCRIPTION_INACTIVE" | "PLAN_UPGRADE_REQUIRED";
    state?: string;
    currentPlan?: string | null;
    featureKey?: string;
  };
};

export type PaidAccessResult =
  | { ok: true }
  | PaidAccessFailure;

export async function checkPaidAccess(
  organizationId: string,
  options: { featureKey?: FeatureKey } = {}
): Promise<PaidAccessResult> {
  // 1. Subscription must be usable (ACTIVE / TRIAL, period not lapsed).
  const state = await getSubscriptionState(organizationId);
  if (!state.hasAccess) {
    return {
      ok: false,
      status: 402,
      payload: {
        error:
          state.state === "EXPIRED"
            ? "Votre abonnement a expiré. Vos données sont conservées : renouvelez votre abonnement pour reprendre."
            : "Aucun abonnement actif. Choisissez un plan pour continuer.",
        code: "SUBSCRIPTION_INACTIVE",
        state: state.state,
      },
    };
  }

  // 2. The plan must include the requested feature.
  if (options.featureKey) {
    const included = await hasEntitlement(organizationId, options.featureKey);
    if (!included) {
      const sub = await getOrganizationSubscriptionSafe(organizationId);
      const planName = sub?.plan?.displayName ?? sub?.plan?.name ?? null;
      return {
        ok: false,
        status: 402,
        payload: {
          error: planName
            ? `Cette fonctionnalité n'est pas incluse dans le plan ${planName}. Passez à un plan supérieur pour la débloquer.`
            : "Cette fonctionnalité n'est pas incluse dans votre plan. Passez à un plan supérieur.",
          code: "PLAN_UPGRADE_REQUIRED",
          currentPlan: planName,
          featureKey: options.featureKey,
        },
      };
    }
  }

  return { ok: true };
}

async function getOrganizationSubscriptionSafe(organizationId: string) {
  try {
    const { getOrganizationSubscription } = await import("@/lib/billing/subscriptions");
    return await getOrganizationSubscription(organizationId);
  } catch {
    return null;
  }
}
