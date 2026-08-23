import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import {
  getOrganizationSubscription,
  createSubscription,
  cancelSubscription,
  reactivateSubscription,
  renewSubscription,
} from "@/lib/billing/subscriptions";
import { billingErrorStatus } from "@/lib/billing/enforcement";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "BILLING_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const subscription = await getOrganizationSubscription(organizationId);
    return NextResponse.json(subscription);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "BILLING_SUBSCRIPTIONS");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    if (!body.planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 });
    }

    // Tenant isolation: the plan must exist; the subscription is always
    // created for the caller's own organization, never a client-supplied org.
    const { db } = await import("@/lib/prisma");
    const plan = await db.plan.findUnique({ where: { id: body.planId } });
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const subscription = await createSubscription({
      organizationId,
      planId: body.planId,
      billingInterval: body.billingInterval === "YEARLY" ? "YEARLY" : "MONTHLY",
      trialDays: body.trialDays,
      couponId: body.couponId,
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "BILLING_SUBSCRIPTIONS");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { subscriptionId, action, atPeriodEnd, reason } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: "subscriptionId is required" }, { status: 400 });
    }

    // ─── Tenant isolation (server-side verification) ────────────
    const { db } = await import("@/lib/prisma");
    const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub || sub.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Subscription does not belong to this organization" },
        { status: 403 }
      );
    }

    if (action === "cancel") {
      const result = await cancelSubscription(subscriptionId, atPeriodEnd !== false, reason);
      return NextResponse.json(result);
    }

    if (action === "reactivate") {
      const result = await reactivateSubscription(subscriptionId);
      return NextResponse.json(result);
    }

    if (action === "renew") {
      const result = await renewSubscription(subscriptionId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    const status = billingErrorStatus(e) ?? 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}
