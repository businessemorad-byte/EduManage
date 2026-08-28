import { NextResponse } from "next/server";
import { requirePlatformAuthResponse } from "@/lib/platform-auth";
import { listSubscriptions, suspendSubscription, renewSubscription, cancelSubscription } from "@/lib/billing/subscriptions";
import { activateSubscription } from "@/lib/billing/subscriptions";

// ─── Platform Subscription Management (PLATFORM_OWNER only) ───
// The platform owner may inspect and manage any organization's
// subscription. Organization routes can only touch their own.

export async function GET(request: Request) {
  const auth = await requirePlatformAuthResponse();
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const planId = searchParams.get("planId") ?? undefined;

  const subscriptions = await listSubscriptions({ status, planId });
  return NextResponse.json({ subscriptions });
}

export async function PATCH(request: Request) {
  const auth = await requirePlatformAuthResponse();
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    const { subscriptionId, action, reason } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: "subscriptionId required" }, { status: 400 });
    }

    switch (action) {
      case "activate":
        return NextResponse.json(await activateSubscription(subscriptionId));
      case "suspend":
        return NextResponse.json(await suspendSubscription(subscriptionId, reason));
      case "renew":
        return NextResponse.json(await renewSubscription(subscriptionId));
      case "cancel":
        return NextResponse.json(await cancelSubscription(subscriptionId, false, reason ?? "cancelled by platform"));
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
