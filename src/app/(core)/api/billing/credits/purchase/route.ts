import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { getCreditPackage } from "@/lib/billing-config";
import { grantCredits } from "@/lib/ai-credits";
import { createBillingInvoice, markInvoicePaid } from "@/lib/billing/invoices";
import { createBillingPayment, completePayment } from "@/lib/billing/payments";

// ─── Extra AI Credit Packages ──────────────────────────────────
// Price is ALWAYS resolved server-side from the centralized
// configuration; the client only sends the package id.

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "BILLING_PAYMENTS");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { packageId } = body;

    const pack = typeof packageId === "string" ? getCreditPackage(packageId) : undefined;
    if (!pack) return NextResponse.json({ error: "Invalid credit package" }, { status: 400 });

    // Amounts are validated server-side and always positive.
    if (!(pack.priceMad > 0) || !(pack.credits > 0)) {
      return NextResponse.json({ error: "Invalid package configuration" }, { status: 500 });
    }

    // Get the active subscription to attach the invoice to (optional).
    const { db } = await import("@/lib/prisma");
    const subscription = await db.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    const invoice = await createBillingInvoice({
      organizationId,
      subscriptionId: subscription?.id ?? "",
      planId: subscription?.planId ?? "",
      amount: pack.priceMad,
      currency: "MAD",
      billingPeriodStart: new Date(),
    });

    // Mock/manual settlement until a real payment provider is connected;
    // a real provider would redirect to checkout and confirm via webhook.
    await markInvoicePaid(invoice.id);
    const payment = await createBillingPayment({
      organizationId,
      invoiceId: invoice.id,
      amount: pack.priceMad,
      currency: "MAD",
      provider: "mock",
      providerRef: `credits_${pack.id}_${Date.now()}`,
      idempotencyKey: `credits_${organizationId}_${pack.id}_${Date.now()}`,
    });
    await completePayment(payment.id, payment.providerRef ?? undefined);

    const transaction = await grantCredits(
      organizationId,
      pack.credits,
      `Achat ${pack.label} (${pack.priceMad} DH)`
    );

    return NextResponse.json({
      invoice: { id: invoice.id, total: pack.priceMad },
      credits: { purchased: pack.credits, transactionId: transaction.id },
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
