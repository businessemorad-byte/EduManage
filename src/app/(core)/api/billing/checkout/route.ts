import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { getOrganizationSubscription, cancelSubscription, activateSubscription } from "@/lib/billing/subscriptions";
import { createBillingInvoice } from "@/lib/billing/invoices";
import { createBillingPayment } from "@/lib/billing/payments";
import { validateCoupon, recordCouponUsage } from "@/lib/billing/coupons";
import { getProvider } from "@/lib/billing/providers";
import { calculatePrice } from "@/lib/billing/plans";
import { recordUsage } from "@/lib/billing/usage";
import { getPlatformConfig } from "@/lib/billing/platform-config";
import { PROMOTION_CONFIG } from "@/lib/billing-config";

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "BILLING_SUBSCRIPTIONS");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { planId, billingInterval, couponCode } = body;

    if (!planId || typeof planId !== "string") {
      return NextResponse.json({ error: "planId required" }, { status: 400 });
    }

    // Server-side price validation: the client NEVER sends an amount.
    const interval = billingInterval === "YEARLY" ? "YEARLY" : "MONTHLY";

    const existing = await getOrganizationSubscription(organizationId);
    if (existing && ["ACTIVE", "TRIAL", "TRIALING"].includes(existing.status)) {
      return NextResponse.json({ error: "Organization already has an active subscription" }, { status: 400 });
    }

    const { db } = await import("@/lib/prisma");
    const plan = await db.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    let couponId: string | undefined;
    if (couponCode) {
      const validation = await validateCoupon(couponCode, organizationId, 0);
      if (validation.valid && validation.couponId) {
        couponId = validation.couponId;
      }
    }

    // Cancel a pending-cancellation or expired previous subscription
    if (existing && existing.status === "PAST_DUE") {
      await cancelSubscription(existing.id, false, "superseded by new checkout");
    }

    const platformConfig = await getPlatformConfig();

    // Create subscription in trial state; activation happens on payment.
    const sub = await db.subscription.create({
      data: {
        organizationId,
        planId,
        status: "TRIAL",
        billingInterval: interval,
        startDate: new Date(),
        trialEndsAt: new Date(Date.now() + (plan.trialDurationDays || 14) * 86400000),
        currentPeriodStart: new Date(),
      },
    });

    // First invoice amount: full period price minus the first-month
    // promotion (e.g. -50%) computed SERVER-SIDE from configuration.
    const listPrice = calculatePrice(plan, interval);
    const firstInvoiceDiscountPct =
      platformConfig.promoActive && PROMOTION_CONFIG.active
        ? PROMOTION_CONFIG.firstMonthDiscountPct
        : 0;
    const discountAmount = Math.round(listPrice * firstInvoiceDiscountPct) / 100;
    const totalAmount = Math.max(0, listPrice - discountAmount);

    const invoice = await createBillingInvoice({
      organizationId,
      subscriptionId: sub.id,
      planId,
      amount: totalAmount,
      currency: plan.currency,
      couponId,
    });

    // Process payment via provider
    const provider = getProvider();
    if (!provider) return NextResponse.json({ error: "No payment provider configured" }, { status: 500 });
    const checkout = await provider.createCheckout({
      amount: totalAmount,
      currency: plan.currency,
      organizationId,
      subscriptionId: sub.id,
      planCode: plan.code,
      interval,
      successUrl: body.successUrl ?? "/billing",
      cancelUrl: body.cancelUrl ?? "/billing/plans",
    });

    const idempotencyKey = `checkout_${sub.id}_${Date.now()}`;
    await createBillingPayment({
      organizationId,
      invoiceId: invoice.id,
      amount: totalAmount,
      currency: plan.currency,
      provider: provider.name,
      providerRef: checkout.sessionId,
      idempotencyKey,
    });

    // Simulate instant settlement with the mock provider only.
    // A real provider confirms via /api/billing/webhook instead.
    if (provider.name === "mock") {
      // activateSubscription sets the period and allocates plan AI credits.
      await activateSubscription(sub.id, checkout.sessionId);
      await db.billingInvoice.update({
        where: { id: invoice.id },
        data: { status: "PAID", paidAt: new Date() },
      });
      await db.billingPayment.updateMany({
        where: { invoiceId: invoice.id, status: "PENDING" },
        data: { status: "SUCCEEDED", completedAt: new Date() },
      });
      await recordUsage(organizationId, "MAX_STUDENTS", 0);
    }

    if (couponId) {
      await recordCouponUsage(couponId, organizationId, invoice.id);
    }

    return NextResponse.json({
      subscription: { id: sub.id },
      checkout: { url: checkout.url, sessionId: checkout.sessionId },
      invoice: {
        id: invoice.id,
        subtotal: listPrice,
        promotionalDiscount: discountAmount,
        total: totalAmount,
      },
    }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";
    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");
    return NextResponse.json({ error }, { status: isKnownAuth ? 401 : 500 });
  }
}
