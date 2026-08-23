import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { getCommunicationDashboard } from "@/lib/communication";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "COMMUNICATION_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const dashboard = await getCommunicationDashboard(organizationId);
    return NextResponse.json(dashboard);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
