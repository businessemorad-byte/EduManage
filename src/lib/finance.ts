import { db } from "@/lib/prisma";
import type { InvoiceStatus, PaymentMethod } from "@/generated/prisma/client";
import { Decimal } from "@prisma/client/runtime/client";
import { emitEvent, EVENT_TYPES } from "@/lib/events";

// ─── Helpers ─────────────────────────────────────────────────────

function toDecimal(v: number | Decimal): Decimal {
  return typeof v === "number" ? new Decimal(v) : v;
}

export function formatAmount(amount: Decimal, currency = "USD"): string {
  return `${currency} ${amount.toFixed(2)}`;
}

// ─── Fee Plans ───────────────────────────────────────────────────

export async function createFeePlan(data: {
  organizationId: string;
  name: string;
  description?: string;
  amount: number;
  currency?: string;
  frequency: string;
  programId?: string;
  subjectId?: string;
}) {
  return db.feePlan.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      description: data.description ?? null,
      amount: new Decimal(data.amount),
      currency: data.currency ?? "USD",
      frequency: data.frequency,
      programId: data.programId ?? null,
      subjectId: data.subjectId ?? null,
    },
  });
}

export async function listFeePlans(organizationId: string) {
  return db.feePlan.findMany({
    where: { organizationId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteFeePlan(id: string) {
  return db.feePlan.update({ where: { id }, data: { isActive: false } });
}

// ─── Discounts ───────────────────────────────────────────────────

export async function createDiscount(data: {
  organizationId: string;
  name: string;
  description?: string;
  type: string;
  value: number;
  feePlanId?: string;
  maxUses?: number;
}) {
  return db.discount.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      description: data.description ?? null,
      type: data.type,
      value: new Decimal(data.value),
      feePlanId: data.feePlanId ?? null,
      maxUses: data.maxUses ?? null,
    },
  });
}

export async function listDiscounts(organizationId: string) {
  return db.discount.findMany({
    where: { organizationId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

function calculateDiscountAmount(discountType: string, discountValue: Decimal, subtotal: Decimal): Decimal {
  if (discountType === "PERCENTAGE") {
    return subtotal.mul(discountValue).div(100);
  }
  return Decimal.min(discountValue, subtotal);
}

// ─── Invoices ────────────────────────────────────────────────────

let invoiceCounter = 0;

function generateInvoiceNumber(): string {
  invoiceCounter++;
  const ts = Date.now().toString(36).toUpperCase();
  const seq = invoiceCounter.toString().padStart(4, "0");
  return `INV-${ts}-${seq}`;
}

export async function createInvoice(data: {
  organizationId: string;
  studentId: string;
  feePlanId?: string;
  discountId?: string;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
  dueDate?: string;
  notes?: string;
}) {
  if (!data.studentId) throw new Error("studentId is required");
  if (!data.items || data.items.length === 0) throw new Error("At least one item is required");
  for (const item of data.items) {
    if (item.quantity <= 0) throw new Error("Item quantity must be positive");
    if (item.unitPrice < 0) throw new Error("Item unitPrice cannot be negative");
  }
  const subtotal = data.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  let discountAmount = new Decimal(0);
  if (data.discountId) {
    const discount = await db.discount.findUnique({ where: { id: data.discountId } });
    if (discount && discount.organizationId === data.organizationId && discount.isActive) {
      if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
        throw new Error("Discount usage limit reached");
      }
      discountAmount = calculateDiscountAmount(discount.type, discount.value, new Decimal(subtotal));
      await db.discount.update({ where: { id: discount.id }, data: { usedCount: { increment: 1 } } });
    }
  }

  const totalAmount = new Decimal(subtotal).sub(discountAmount);
  const invoiceNumber = generateInvoiceNumber();

  const invoice = await db.invoice.create({
    data: {
      organizationId: data.organizationId,
      studentId: data.studentId,
      feePlanId: data.feePlanId ?? null,
      discountId: data.discountId ?? null,
      invoiceNumber,
      subtotal: new Decimal(subtotal),
      discountAmount,
      totalAmount,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes ?? null,
      items: {
        create: data.items.map((item) => ({
          organizationId: data.organizationId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: new Decimal(item.unitPrice),
          amount: new Decimal(item.unitPrice * item.quantity),
        })),
      },
    },
    include: { items: true },
  });

  // Emit event
  await emitEvent({
    type: EVENT_TYPES.INVOICE_CREATED,
    organizationId: data.organizationId,
    payload: { id: invoice.id, amount: totalAmount.toNumber() },
  });

  return invoice;
}

export async function listInvoices(organizationId: string, params?: { studentId?: string; status?: InvoiceStatus }) {
  return db.invoice.findMany({
    where: {
      organizationId,
      ...(params?.studentId ? { studentId: params.studentId } : {}),
      ...(params?.status ? { status: params.status } : {}),
    },
    include: {
      student: { include: { person: { select: { firstName: true, lastName: true } } } },
      items: true,
      payments: { select: { amount: true, status: true, paidAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoice(id: string, organizationId: string) {
  return db.invoice.findFirst({
    where: { id, organizationId },
    include: {
      student: { include: { person: { select: { firstName: true, lastName: true } } } },
      items: true,
      payments: true,
      refunds: true,
    },
  });
}

// ─── Payments ────────────────────────────────────────────────────

let paymentCounter = 0;

function generateReceiptNumber(): string {
  paymentCounter++;
  const ts = Date.now().toString(36).toUpperCase();
  const seq = paymentCounter.toString().padStart(4, "0");
  return `PAY-${ts}-${seq}`;
}

export async function createPayment(data: {
  organizationId: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}) {
  if (data.amount <= 0) throw new Error("Payment amount must be positive");

  const invoice = await db.invoice.findFirst({
    where: { id: data.invoiceId, organizationId: data.organizationId },
  });

  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "CANCELLED") throw new Error("Cannot pay a cancelled invoice");

  // Duplicate-submission guard: same invoice + same external reference +
  // same amount already completed ⇒ almost certainly a double click / retry.
  if (data.reference) {
    const duplicate = await db.payment.findFirst({
      where: {
        organizationId: data.organizationId,
        invoiceId: data.invoiceId,
        reference: data.reference,
        amount: new Decimal(data.amount),
        status: "COMPLETED",
      },
      select: { id: true },
    });
    if (duplicate) throw new Error(`A payment with reference "${data.reference}" was already recorded for this invoice`);
  }

  const paidAmount = toDecimal(invoice.paidAmount);
  const totalAmount = toDecimal(invoice.totalAmount);
  const paymentAmount = new Decimal(data.amount);
  const remaining = totalAmount.sub(paidAmount);

  if (paymentAmount.gt(remaining)) {
    throw new Error(`Payment exceeds remaining balance of ${remaining.toFixed(2)}`);
  }

  const receiptNumber = generateReceiptNumber();

  const payment = await db.payment.create({
    data: {
      organizationId: data.organizationId,
      invoiceId: data.invoiceId,
      receiptNumber,
      amount: paymentAmount,
      method: data.method,
      reference: data.reference ?? null,
      notes: data.notes ?? null,
    },
  });

  // Update invoice
  const newPaidAmount = paidAmount.add(paymentAmount);
  const newStatus: InvoiceStatus = newPaidAmount.gte(totalAmount) ? "PAID" : "PARTIAL";

  await db.invoice.update({
    where: { id: data.invoiceId },
    data: { paidAmount: newPaidAmount, status: newStatus },
  });

  // Record transaction
  await db.financialTransaction.create({
    data: {
      organizationId: data.organizationId,
      type: "PAYMENT",
      referenceId: payment.id,
      amount: paymentAmount,
      currency: invoice.currency,
      description: `Payment for ${invoice.invoiceNumber}`,
    },
  });

  // Emit event
  await emitEvent({
    type: EVENT_TYPES.PAYMENT_CREATED,
    organizationId: data.organizationId,
    payload: { id: payment.id, invoiceId: data.invoiceId, amount: paymentAmount.toNumber() },
  });

  return payment;
}

export async function listPayments(organizationId: string, params?: { invoiceId?: string; studentId?: string }) {
  const where: Record<string, unknown> = { organizationId };
  if (params?.invoiceId) where.invoiceId = params.invoiceId;
  if (params?.studentId) where.invoice = { studentId: params.studentId };

  return db.payment.findMany({
    where,
    include: {
      invoice: { select: { invoiceNumber: true, totalAmount: true } },
    },
    orderBy: { paidAt: "desc" },
  });
}

// ─── Refunds ─────────────────────────────────────────────────────

export async function createRefund(data: {
  organizationId: string;
  paymentId: string;
  amount: number;
  reason?: string;
}) {
  if (data.amount <= 0) throw new Error("Refund amount must be positive");

  const payment = await db.payment.findFirst({
    where: { id: data.paymentId, organizationId: data.organizationId },
    include: { invoice: true },
  });

  if (!payment) throw new Error("Payment not found");
  if (payment.status === "REFUNDED") throw new Error("Payment already fully refunded");

  const refundAmount = new Decimal(data.amount);
  const paymentAmount = toDecimal(payment.amount);
  const totalRefunded = await db.refund.aggregate({
    where: { paymentId: data.paymentId },
    _sum: { amount: true },
  });
  const alreadyRefunded = totalRefunded._sum.amount ?? new Decimal(0);
  const availableRefund = paymentAmount.sub(alreadyRefunded);

  if (refundAmount.gt(availableRefund)) {
    throw new Error(`Refund exceeds available amount of ${availableRefund.toFixed(2)}`);
  }

  const refund = await db.refund.create({
    data: {
      organizationId: data.organizationId,
      invoiceId: payment.invoiceId,
      paymentId: data.paymentId,
      amount: refundAmount,
      reason: data.reason ?? null,
    },
  });

  // Update invoice paid amount
  const newPaidAmount = toDecimal(payment.invoice.paidAmount).sub(refundAmount);
  const newStatus: InvoiceStatus = newPaidAmount.lte(0) ? "PENDING" : "PARTIAL";

  await db.invoice.update({
    where: { id: payment.invoiceId },
    data: { paidAmount: newPaidAmount, status: newStatus },
  });

  // Update payment status
  const totalPaymentRefunds = await db.refund.aggregate({
    where: { paymentId: data.paymentId },
    _sum: { amount: true },
  });
  const totalRefundForPayment = (totalPaymentRefunds._sum.amount ?? new Decimal(0)) as Decimal;
  const newPaymentStatus = totalRefundForPayment.gte(paymentAmount) ? "REFUNDED" : "PARTIAL_REFUND";
  await db.payment.update({ where: { id: data.paymentId }, data: { status: newPaymentStatus } });

  // Record transaction
  await db.financialTransaction.create({
    data: {
      organizationId: data.organizationId,
      type: "REFUND",
      referenceId: refund.id,
      amount: refundAmount,
      currency: payment.invoice.currency,
      description: `Refund for ${payment.receiptNumber}`,
    },
  });

  return refund;
}

// ─── Dashboard / Metrics ─────────────────────────────────────────

export async function getFinanceSummary(organizationId: string) {
  const [invoiced, paid, refunded, outstanding] = await Promise.all([
    db.invoice.aggregate({ where: { organizationId }, _sum: { totalAmount: true } }),
    db.payment.aggregate({ where: { organizationId, status: "COMPLETED" }, _sum: { amount: true } }),
    db.refund.aggregate({ where: { organizationId }, _sum: { amount: true } }),
    db.invoice.aggregate({ where: { organizationId, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } }, _sum: { totalAmount: true, paidAmount: true } }),
  ]);

  const totalInvoiced = invoiced._sum.totalAmount ?? new Decimal(0);
  const totalPaid = paid._sum.amount ?? new Decimal(0);
  const totalRefunded = refunded._sum.amount ?? new Decimal(0);
  const totalOutstanding = (outstanding._sum.totalAmount ?? new Decimal(0)).sub(outstanding._sum.paidAmount ?? new Decimal(0));

  return {
    totalInvoiced,
    totalPaid,
    totalRefunded,
    totalOutstanding,
  };
}

// ─── Domain Events (delegates to central bus) ──────────────────

export type FinancialEvent = {
  type: "payment.created" | "payment.overdue" | "invoice.created";
  organizationId: string;
  invoiceId?: string;
  amount: Decimal;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- deprecated: use onEvent() from @/lib/events instead
export function onFinancialEvent(_handler: (event: FinancialEvent) => void | Promise<void>) {}

export async function emitFinancialEvent(event: FinancialEvent) {
  await emitEvent({
    type: event.type,
    organizationId: event.organizationId,
    payload: { invoiceId: event.invoiceId, amount: event.amount.toNumber() },
  });
}
