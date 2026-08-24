import { db } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { emitEvent, EVENT_TYPES } from "@/lib/events";
import { calculateDiscount } from "@/lib/billing/coupons";

// ─── Invoice Generation ──────────────────────────────────────

let billingInvoiceCounter = 0;

function generateBillingInvoiceNumber(): string {
  billingInvoiceCounter++;
  const ts = Date.now().toString(36).toUpperCase();
  const seq = billingInvoiceCounter.toString().padStart(4, "0");
  return `BIL-${ts}-${seq}`;
}

export async function createBillingInvoice(params: {
  organizationId: string;
  subscriptionId: string;
  planId: string;
  amount: number;
  currency?: string;
  couponId?: string;
  billingPeriodStart?: Date;
  billingPeriodEnd?: Date;
}) {
  const plan = await db.plan.findUnique({ where: { id: params.planId } });
  if (!plan) throw new Error("Plan not found");

  const subtotal = new Prisma.Decimal(params.amount);
  let discountAmount = new Prisma.Decimal(0);

  if (params.couponId) {
    const coupon = await db.coupon.findUnique({ where: { id: params.couponId } });
    if (coupon && coupon.isActive) {
      discountAmount = new Prisma.Decimal(calculateDiscount(coupon.discountType, Number(coupon.discountValue), params.amount));
    }
  }

  const totalAmount = subtotal.sub(discountAmount);
  const invoiceNumber = generateBillingInvoiceNumber();

  const invoice = await db.billingInvoice.create({
    data: {
      organizationId: params.organizationId,
      subscriptionId: params.subscriptionId,
      planId: params.planId,
      invoiceNumber,
      status: "OPEN",
      subtotal,
      discountAmount,
      taxAmount: new Prisma.Decimal(0),
      totalAmount,
      currency: params.currency ?? plan.currency,
      couponId: params.couponId ?? null,
      billingPeriodStart: params.billingPeriodStart ?? new Date(),
      billingPeriodEnd: params.billingPeriodEnd ?? null,
      items: {
        create: {
          organizationId: params.organizationId,
          description: `${plan.displayName} - ${params.amount > 0 ? "Subscription" : "Trial"}`,
          quantity: 1,
          unitPrice: subtotal,
          amount: subtotal,
        },
      },
    },
    include: { items: true },
  });

  await emitEvent({ type: EVENT_TYPES.BILLING_INVOICE_CREATED, organizationId: params.organizationId, payload: { invoiceId: invoice.id, total: totalAmount.toNumber() } });

  return invoice;
}

// ─── Mark Invoice Paid ───────────────────────────────────────

export async function markInvoicePaid(invoiceId: string) {
  return db.billingInvoice.update({
    where: { id: invoiceId },
    data: { status: "PAID", paidAt: new Date() },
  });
}

export async function markInvoiceVoid(invoiceId: string) {
  return db.billingInvoice.update({
    where: { id: invoiceId },
    data: { status: "VOID" },
  });
}

// ─── Queries ──────────────────────────────────────────────────

export async function getBillingInvoice(id: string) {
  return db.billingInvoice.findUnique({
    where: { id },
    include: { items: true, payments: true, coupon: true },
  });
}

export async function listBillingInvoices(organizationId: string, params?: { status?: string; limit?: number }) {
  return db.billingInvoice.findMany({
    where: {
      organizationId,
      ...(params?.status ? { status: params.status } : {}),
    },
    include: { items: true, payments: true },
    orderBy: { issuedAt: "desc" },
    take: params?.limit,
  });
}


