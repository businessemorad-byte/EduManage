import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { requirePlatformAuthResponse } from "@/lib/platform-auth";
import { listPlans, createPlan as createPlanLib, updatePlan, archivePlan, setPlanFeatures } from "@/lib/billing/plans";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "BILLING_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const plans = await listPlans();
    return NextResponse.json(plans);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAuthResponse();
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const plan = await createPlanLib(body);

    if (body.features) {
      await setPlanFeatures(plan.id, body.features);
    }

    return NextResponse.json(plan, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requirePlatformAuthResponse();
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const { id, features, ...updateData } = body;

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const plan = await updatePlan(id, updateData);

    if (features) {
      await setPlanFeatures(id, features);
    }

    return NextResponse.json(plan);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requirePlatformAuthResponse();
    if ("response" in auth) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")!;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const plan = await archivePlan(id);
    return NextResponse.json(plan);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
