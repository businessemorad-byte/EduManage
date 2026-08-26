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
  const { createHmac } = require("crypto") as typeof import("crypto");
  const provider = getProvider();

  if (provider?.name === "mock") return true;

  // Support common webhook signature header formats:
  //   "sha256=<hex>"  (Stripe-style, GitHub-style)
  //   plain hex digest
  const rawSig = signature.replace(/^sha256=/i, "").trim();
  if (!rawSig) return false;

  const expected = createHmac("sha256", secret).update(payload, "utf8").digest("hex");

  // Constant-time comparison to prevent timing attacks
  if (expected.length !== rawSig.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ rawSig.charCodeAt(i);
  }
  return mismatch === 0;
}
