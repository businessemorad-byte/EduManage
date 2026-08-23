import { db } from "@/lib/prisma";
import { emitEvent, audit, EVENT_TYPES } from "@/lib/events";

// ─── Create Payment ──────────────────────────────────────────

export async function createBillingPayment(params: {
  organizationId: string;
  invoiceId: string;
  amount: number;
  currency?: string;
  provider?: string;
  providerRef?: string;
  paymentMethodType?: string;
  idempotencyKey?: string;
}) {
  if (params.idempotencyKey) {
    const existing = await db.billingPayment.findUnique({ where: { idempotencyKey: params.idempotencyKey } });
    if (existing) return existing;
  }

  const payment = await db.billingPayment.create({
    data: {
      organizationId: params.organizationId,
      invoiceId: params.invoiceId,
      amount: params.amount,
      currency: params.currency ?? "USD",
      provider: params.provider ?? "mock",
      providerRef: params.providerRef ?? null,
      paymentMethodType: params.paymentMethodType ?? null,
      idempotencyKey: params.idempotencyKey ?? null,
    },
  });

  await emitEvent({ type: EVENT_TYPES.BILLING_PAYMENT_CREATED, organizationId: params.organizationId, payload: { paymentId: payment.id, amount: params.amount } });
  await audit({ organizationId: params.organizationId, action: "payment.created", resource: "BillingPayment", resourceId: payment.id });

  return payment;
}

// ─── Update Payment Status ───────────────────────────────────

export async function completePayment(paymentId: string, providerRef?: string) {
  const payment = await db.billingPayment.update({
    where: { id: paymentId },
    data: { status: "SUCCEEDED", completedAt: new Date(), providerRef: providerRef ?? undefined },
  });

  await emitEvent({ type: EVENT_TYPES.BILLING_PAYMENT_SUCCEEDED, organizationId: payment.organizationId, payload: { paymentId } });
  return payment;
}

export async function failPayment(paymentId: string, reason?: string) {
  const payment = await db.billingPayment.update({
    where: { id: paymentId },
    data: { status: "FAILED", failureReason: reason ?? null },
  });

  await emitEvent({ type: EVENT_TYPES.BILLING_PAYMENT_FAILED, organizationId: payment.organizationId, payload: { paymentId, reason } });
  return payment;
}

// ─── Queries ──────────────────────────────────────────────────

export async function listBillingPayments(organizationId: string) {
  return db.billingPayment.findMany({
    where: { organizationId },
    include: { invoice: { select: { invoiceNumber: true, totalAmount: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBillingPayment(id: string) {
  return db.billingPayment.findUnique({ where: { id }, include: { invoice: true } });
}
