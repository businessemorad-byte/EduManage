import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createCampaign, listCampaigns, updateCampaign } from "@/lib/communication";
import { checkPaidAccess } from "@/lib/billing/enforcement";
import { FeatureKey } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "CAMPAIGNS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const searchParams = new URL(request.url).searchParams;

    const result = await listCampaigns(
      organizationId,
      { status: searchParams.get("status") ?? undefined },
      searchParams.get("page") ? Number(searchParams.get("page")) : 1
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "CAMPAIGNS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Campaigns are a paid plan feature — enforced server-side.
    const access = await checkPaidAccess(organizationId, {
      featureKey: FeatureKey.COMMUNICATION_CAMPAIGNS,
    });
    if (!access.ok) return NextResponse.json(access.payload, { status: access.status });

    const body = await request.json();

    if (body.action === "update") {
      const { id, ...data } = body;
      if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
      await updateCampaign(id, organizationId, data);
      return NextResponse.json({ success: true });
    }

    if (!body.name || !body.channels || !body.audience) {
      return NextResponse.json({ error: "name, channels, and audience are required" }, { status: 400 });
    }

    const campaign = await createCampaign({ ...body, organizationId });
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
