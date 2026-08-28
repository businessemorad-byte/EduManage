import { NextResponse } from "next/server";
import { requirePlatformAuthResponse } from "@/lib/platform-auth";
import { listCoupons, createCoupon, deactivateCoupon } from "@/lib/billing/coupons";

export async function GET() {
  try {
    const auth = await requirePlatformAuthResponse();
    if ("response" in auth) return auth.response;

    const coupons = await listCoupons();
    return NextResponse.json(coupons);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAuthResponse();
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const coupon = await createCoupon(body);
    return NextResponse.json(coupon, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requirePlatformAuthResponse();
    if ("response" in auth) return auth.response;

    const body = await request.json();
    if (body.action === "deactivate" && body.id) {
      const coupon = await deactivateCoupon(body.id);
      return NextResponse.json(coupon);
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
