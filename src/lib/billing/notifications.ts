import { db } from "@/lib/prisma";
import { emitEvent, EVENT_TYPES } from "@/lib/events";

// ─── Billing Notifications ───────────────────────────────────

export async function sendBillingNotification(params: {
  organizationId: string;
  title: string;
  body: string;
  type?: string;
  sourceEvent?: string;
  metadata?: Record<string, unknown>;
}) {
  const orgMembers = await db.organizationMember.findMany({
    where: { organizationId: params.organizationId, isActive: true },
    select: { userId: true },
  });

  for (const member of orgMembers) {
    await db.notification.create({
      data: {
        organizationId: params.organizationId,
        userId: member.userId,
        title: params.title,
        body: params.body,
        type: params.type ?? "INFO",
        category: "billing",
        sourceEvent: params.sourceEvent ?? null,
        metadata: (params.metadata as never) ?? undefined,
      },
    });
  }
}

// ─── Specific Billing Events ─────────────────────────────────

export async function notifyTrialEnding(organizationId: string, daysLeft: number) {
  await sendBillingNotification({
    organizationId,
    title: "Trial Ending Soon",
    body: `Your trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Upgrade to continue using all features.`,
    type: "WARNING",
    sourceEvent: "billing.trial.ending",
  });
  await emitEvent({ type: EVENT_TYPES.BILLING_TRIAL_ENDING, organizationId, payload: { daysLeft } });
}

export async function notifyPaymentSucceeded(organizationId: string, amount: number, invoiceNumber: string) {
  await sendBillingNotification({
    organizationId,
    title: "Payment Successful",
    body: `Payment of ${amount} received for invoice ${invoiceNumber}.`,
    type: "SUCCESS",
    sourceEvent: "billing.payment.succeeded",
  });
}

export async function notifyPaymentFailed(organizationId: string, invoiceNumber: string) {
  await sendBillingNotification({
    organizationId,
    title: "Payment Failed",
    body: `Payment for invoice ${invoiceNumber} failed. Please update your payment method.`,
    type: "ERROR",
    sourceEvent: "billing.payment.failed",
  });
}

export async function notifySubscriptionChanged(organizationId: string, changeType: string, planName: string) {
  await sendBillingNotification({
    organizationId,
    title: "Subscription Updated",
    body: `Your subscription has been ${changeType}. New plan: ${planName}.`,
    type: "INFO",
    sourceEvent: `billing.subscription.${changeType}`,
  });
}
