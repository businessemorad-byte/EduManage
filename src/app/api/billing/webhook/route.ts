import { NextResponse } from "next/server";
import { processWebhook, verifyWebhookSignature } from "@/lib/billing/webhooks";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, providerEventId, eventType, payload, signature } = body;

    if (!provider || !providerEventId || !eventType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (signature && !verifyWebhookSignature(JSON.stringify(payload), signature, process.env.WEBHOOK_SECRET ?? "")) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const result = await processWebhook(provider, providerEventId, eventType, payload ?? {});
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
