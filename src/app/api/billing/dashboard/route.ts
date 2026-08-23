import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { getOrganizationSubscription } from "@/lib/billing/subscriptions";
import { getSubscriptionState } from "@/lib/billing/enforcement";
import { getUsageDashboard } from "@/lib/billing/usage";
import { listBillingInvoices } from "@/lib/billing/invoices";
import { listBillingPayments } from "@/lib/billing/payments";
import { getBalance, getRemainingCredits } from "@/lib/ai-credits";
import {
  CREDIT_PACKAGES,
  PROMOTION_CONFIG,
  getIncludedCreditsForPlanCode,
} from "@/lib/billing-config";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "BILLING_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [subscription, state, usage, invoices, payments, balance, remainingCredits] =
      await Promise.all([
        getOrganizationSubscription(organizationId),
        getSubscriptionState(organizationId),
        getUsageDashboard(organizationId),
        listBillingInvoices(organizationId, { limit: 10 }),
        listBillingPayments(organizationId),
        getBalance(organizationId),
        getRemainingCredits(organizationId),
      ]);

    const includedCredits = subscription
      ? getIncludedCreditsForPlanCode(subscription.plan.code)
      : null;

    return NextResponse.json({
      subscription,
      billingState: {
        state: state.state,
        hasAccess: state.hasAccess,
        lapsed: state.lapsed,
      },
      aiCredits: {
        included: includedCredits ?? balance.monthlyAllowance,
        used: balance.usedThisMonth,
        extra: balance.extraCredits,
        remaining: remainingCredits,
        periodStart: balance.periodStart,
        periodEnd: balance.periodEnd,
      },
      packages: CREDIT_PACKAGES,
      promotion: {
        active: PROMOTION_CONFIG.active,
        firstMonthDiscountPct: PROMOTION_CONFIG.firstMonthDiscountPct,
        label: PROMOTION_CONFIG.label,
      },
      usage,
      recentInvoices: invoices,
      payments,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
