import { NextResponse } from "next/server";
import { processWebhook, verifyWebhookSignature } from "@/lib/billing/webhooks";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, providerEventId, eventType, payload, signature } = body;

    if (!provider || !providerEventId || !eventType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Signature verification is mandatory in production.
    // In development with mock provider, it is skipped.
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (process.env.NODE_ENV === "production" && !webhookSecret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }
    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }
      const isValid = verifyWebhookSignature(JSON.stringify(payload), signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const result = await processWebhook(provider, providerEventId, eventType, payload ?? {});
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
