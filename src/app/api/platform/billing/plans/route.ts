import { NextResponse } from "next/server";
import { requirePlatformAuthResponse } from "@/lib/platform-auth";
import { listPlans, createPlan, updatePlan, archivePlan } from "@/lib/billing/plans";

// ─── Platform Plan Management (PLATFORM_OWNER only) ───────────
// Prices are stored on the Plan rows; the platform owner updates
// them here. Organization-scoped permissions are never accepted.

export async function GET() {
  const auth = await requirePlatformAuthResponse();
  if ("response" in auth) return auth.response;

  const plans = await listPlans(true);
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

    return NextResponse.json({ plan }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requirePlatformAuthResponse();
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    const { planId, ...updates } = body;
    if (!planId) return NextResponse.json({ error: "planId required" }, { status: 400 });

    // Whitelist of owner-editable fields — never trust arbitrary payloads.
    const data: Record<string, unknown> = {};
    if (updates.displayName !== undefined) data.displayName = String(updates.displayName);
    if (updates.description !== undefined) data.description = String(updates.description);
    if (updates.priceMonthly !== undefined) {
      if (!(Number(updates.priceMonthly) >= 0)) {
        return NextResponse.json({ error: "priceMonthly must be positive" }, { status: 400 });
      }
      data.priceMonthly = Number(updates.priceMonthly);
    }
    if (updates.priceYearly !== undefined) {
      if (!(Number(updates.priceYearly) >= 0)) {
        return NextResponse.json({ error: "priceYearly must be positive" }, { status: 400 });
      }
      data.priceYearly = Number(updates.priceYearly);
    }
    if (updates.isActive !== undefined) data.isActive = Boolean(updates.isActive);
    if (updates.sortOrder !== undefined) data.sortOrder = Number(updates.sortOrder);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    if (updates.isActive === false) {
      await archivePlan(planId);
      const archived = await updatePlan(planId, {});
      return NextResponse.json({ plan: archived });
    }

    const plan = await updatePlan(planId, data);
    return NextResponse.json({ plan });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
