import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import {
  upgradeSubscription,
  downgradeSubscription,
  getOrganizationSubscription,
} from "@/lib/billing/subscriptions";
import { checkLimit } from "@/lib/billing/usage";
import { listPlans, calculatePrice } from "@/lib/billing/plans";
import { createBillingInvoice, markInvoicePaid } from "@/lib/billing/invoices";
import { createBillingPayment, completePayment } from "@/lib/billing/payments";
import { getProvider } from "@/lib/billing/providers";
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

    // Idempotency: if the plan already switched (e.g. a retried request),
    // do not create a second charge for the difference.
    if (sub.planId === newPlanId) {
      return NextResponse.json({ ...sub, alreadyOnPlan: true });
    }

    const newPlan = (await listPlans()).find((p) => p.id === newPlanId);
    if (!newPlan) return NextResponse.json({ error: "Target plan not found" }, { status: 404 });

    // Prices are compared on the subscription's own billing interval so a
    // MONTHLY and a YEARLY comparison never mix units.
    const interval = sub.billingInterval === "YEARLY" ? "YEARLY" : "MONTHLY";
    const currentPrice = calculatePrice(sub.plan, interval);
    const targetPrice = calculatePrice(newPlan, interval);
    const isUpgrade = targetPrice > currentPrice;
    const priceDifference = Math.max(0, targetPrice - currentPrice);

    // Downgrade / cheaper plan: keep the requirement that current usage
    // must fit the target plan's limits before allowing the switch.
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

      return NextResponse.json(await downgradeSubscription(subscriptionId, newPlanId));
    }

    // Upgrade: the price difference must be paid before the plan changes.
    // The amount is computed SERVER-SIDE and collected through the same
    // payment-provider flow as the initial checkout — no free upgrades.
    let invoice: { id: string; amount: number } | undefined;

    if (priceDifference > 0) {
      const currency = newPlan.currency ?? sub.plan.currency ?? "USD";

      const billingInvoice = await createBillingInvoice({
        organizationId,
        subscriptionId: sub.id,
        planId: newPlan.id,
        amount: priceDifference,
        billingPeriodStart: sub.currentPeriodStart ?? new Date(),
      });

      const provider = getProvider();
      if (!provider) return NextResponse.json({ error: "No payment provider configured" }, { status: 500 });

      const checkout = await provider.createCheckout({
        amount: priceDifference,
        currency,
        organizationId,
        subscriptionId: sub.id,
        planCode: newPlan.code,
        interval,
        successUrl: typeof body.successUrl === "string" ? body.successUrl : "/billing",
        cancelUrl: typeof body.cancelUrl === "string" ? body.cancelUrl : "/billing/plans",
      });

      const payment = await createBillingPayment({
        organizationId,
        invoiceId: billingInvoice.id,
        amount: priceDifference,
        currency,
        provider: provider.name,
        providerRef: checkout.sessionId,
        idempotencyKey: `plan_change_${sub.id}_${newPlanId}`,
      });

      // A real provider confirms via /api/billing/webhook; the plan stays
      // put until then. The mock provider settles synchronously (same
      // behaviour as the checkout flow).
      if (provider.name !== "mock") {
        return NextResponse.json({
          requiresPayment: true,
          checkout: { url: checkout.url, sessionId: checkout.sessionId },
          invoice: { id: billingInvoice.id, amount: priceDifference },
          message: "Plan change pending payment confirmation",
        }, { status: 202 });
      }

      await markInvoicePaid(billingInvoice.id);
      await completePayment(payment.id, checkout.sessionId);
      invoice = { id: billingInvoice.id, amount: priceDifference };
    }

    const upgraded = await upgradeSubscription(subscriptionId, newPlanId);

    return NextResponse.json({
      ...upgraded,
      ...(invoice ? { payment: invoice } : {}),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}