import { NextResponse } from "next/server";
import { requirePlatformAuthResponse } from "@/lib/platform-auth";
import { getPlatformBillingMetrics } from "@/lib/billing/metrics";

export async function GET() {
  try {
    const auth = await requirePlatformAuthResponse();
    if ("response" in auth) return auth.response;

    const metrics = await getPlatformBillingMetrics();
    return NextResponse.json(metrics);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
