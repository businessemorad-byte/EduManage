import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { getGradingConfig, updateGradingConfig } from "@/lib/reportcards";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "REPORT_CARDS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const config = await getGradingConfig(organizationId);
    return NextResponse.json({ config });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "REPORT_CARDS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();
    const config = await updateGradingConfig(organizationId, body);
    return NextResponse.json({ config });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
