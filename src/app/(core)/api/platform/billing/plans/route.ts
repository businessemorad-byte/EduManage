import { NextResponse } from "next/server";
import { requirePlatformAuthResponse } from "@/lib/platform-auth";
import { listPlans, createPlan, updatePlan, archivePlan } from "@/lib/billing/plans";
import {
  serializePlatformPlan,
  parsePlatformPlanPatch,
} from "@/lib/billing/platform-plans";

// ─── Platform Plan Management (PLATFORM_OWNER only) ───────────
// Prices are stored on the Plan rows; the platform owner updates
// them here. Organization-scoped permissions are never accepted.
// All responses are serialized through the shared PlatformPlan DTO
// so the client contract stays stable and null-safe.

export async function GET() {
  const auth = await requirePlatformAuthResponse();
  if ("response" in auth) return auth.response;

  const plans = (await listPlans(true)).map(serializePlatformPlan);
  return NextResponse.json({ plans });
}

export async function POST(request: Request) {
  const auth = await requirePlatformAuthResponse();
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    const { name, code, displayName, priceMonthly, priceYearly, currency, description, sortOrder } = body;

    if (!name || !code || !displayName) {
      return NextResponse.json({ error: "name, code and displayName required" }, { status: 400 });
    }
    if (priceMonthly !== undefined && !(Number(priceMonthly) >= 0)) {
      return NextResponse.json({ error: "priceMonthly must be a positive number" }, { status: 400 });
    }

    const plan = await createPlan({
      name,
      code,
      displayName,
      description,
      priceMonthly: priceMonthly !== undefined ? Number(priceMonthly) : undefined,
      priceYearly: priceYearly !== undefined ? Number(priceYearly) : undefined,
      currency: currency ?? "MAD",
      sortOrder,
    });

    return NextResponse.json({ plan: serializePlatformPlan(plan) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requirePlatformAuthResponse();
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    const result = parsePlatformPlanPatch(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (result.data.isActive === false) {
      const archived = await archivePlan(result.planId);
      return NextResponse.json({ plan: serializePlatformPlan(archived) });
    }

    const plan = await updatePlan(result.planId, result.data);
    return NextResponse.json({ plan: serializePlatformPlan(plan) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}