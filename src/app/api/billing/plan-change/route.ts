import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { upgradeSubscription, downgradeSubscription } from "@/lib/billing/subscriptions";
import { getOrganizationSubscription } from "@/lib/billing/subscriptions";
import { checkLimit } from "@/lib/billing/usage";
import { listPlans } from "@/lib/billing/plans";
import { FeatureKey } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "BILLING_SUBSCRIPTIONS");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { subscriptionId, newPlanId } = body;

    if (!subscriptionId || !newPlanId) {
      return NextResponse.json({ error: "subscriptionId and newPlanId required" }, { status: 400 });
    }

    const sub = await getOrganizationSubscription(organizationId);
    if (!sub) return NextResponse.json({ error: "No active subscription" }, { status: 404 });

    if (sub.id !== subscriptionId) {
      return NextResponse.json({ error: "Subscription does not belong to this organization" }, { status: 403 });
    }

    const newPlan = (await listPlans()).find((p) => p.id === newPlanId);
    if (!newPlan) return NextResponse.json({ error: "Target plan not found" }, { status: 404 });

    const isUpgrade = Number(newPlan.priceMonthly ?? 0) > Number(sub.plan.priceMonthly ?? 0);

    // Downgrade protection
    if (!isUpgrade) {
      const warnings: string[] = [];
      const limitFeatures = [FeatureKey.MAX_STUDENTS, FeatureKey.MAX_TEACHERS, FeatureKey.MAX_GROUPS, FeatureKey.MAX_BRANCHES];

      for (const key of limitFeatures) {
        const usage = await checkLimit(organizationId, key);
        if (usage.limit !== null && !usage.allowed) {
          warnings.push(`${key}: current usage exceeds new plan limit`);
        }
      }

      if (warnings.length > 0) {
        return NextResponse.json({
          requiresConfirmation: true,
          warnings,
          currentPlan: sub.plan.name,
          newPlan: newPlan.displayName,
        });
      }
    }

    const result = isUpgrade
      ? await upgradeSubscription(subscriptionId, newPlanId)
      : await downgradeSubscription(subscriptionId, newPlanId);

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
