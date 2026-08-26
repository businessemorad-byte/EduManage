import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { getUsageDashboard } from "@/lib/billing/usage";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "BILLING_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const usage = await getUsageDashboard(organizationId);
    return NextResponse.json(usage);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
