import { db } from "@/lib/prisma";
import { getProvider } from "@/lib/billing/providers";
import { completePayment, failPayment } from "@/lib/billing/payments";
import { markInvoicePaid } from "@/lib/billing/invoices";
import { renewSubscription, markPastDue } from "@/lib/billing/subscriptions";

// ─── Webhook Processing ──────────────────────────────────────

export async function processWebhook(provider: string, providerEventId: string, eventType: string, payload: Record<string, unknown>) {
  const existing = await db.webhookEvent.findUnique({
    where: { provider_providerEventId: { provider, providerEventId } },
  });

  if (existing) {
    if (existing.status === "PROCESSED") return { processed: false, reason: "duplicate" };
  }

  const event = existing
    ? await db.webhookEvent.update({ where: { id: existing.id }, data: { payload: payload as never, status: "RECEIVED" } })
    : await db.webhookEvent.create({ data: { provider, providerEventId, eventType, payload: payload as never, status: "RECEIVED" } });

  try {
    await handleWebhookEvent(provider, eventType, payload);
    await db.webhookEvent.update({ where: { id: event.id }, data: { status: "PROCESSED", processedAt: new Date() } });
    return { processed: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await db.webhookEvent.update({ where: { id: event.id }, data: { status: "FAILED" } });
    return { processed: false, error: message };
  }
}

async function handleWebhookEvent(provider: string, eventType: string, payload: Record<string, unknown>) {
  const data = (payload.data ?? payload) as Record<string, unknown>;

  switch (eventType) {
    case "payment.succeeded":
    case "invoice.paid": {
      const paymentId = data.paymentId as string | undefined;
      const invoiceId = data.invoiceId as string | undefined;
      if (paymentId) await completePayment(paymentId, data.providerRef as string);
      if (invoiceId) await markInvoicePaid(invoiceId);
      if (data.subscriptionId) await renewSubscription(data.subscriptionId as string);
      break;
    }
    case "payment.failed":
    case "invoice.failed": {
      const paymentId = data.paymentId as string | undefined;
      if (paymentId) await failPayment(paymentId, data.reason as string);
      if (data.subscriptionId) await markPastDue(data.subscriptionId as string);
      break;
    }
    case "subscription.canceled": {
      break;
    }
    default:
      break;
  }
}

// ─── Webhook Signature Verification ──────────────────────────

export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  // In production, implement HMAC-SHA256 verification per provider
  // Mock provider always returns true
  const provider = getProvider();
  if (provider?.name === "mock") return true;
  void payload; void signature; void secret;
  return false;
}
