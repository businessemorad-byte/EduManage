import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createLead, listLeads, updateLeadStatus, convertLead, getLeadStats } from "@/lib/leads";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "LEADS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    if (searchParams.get("action")! === "stats") {
      const stats = await getLeadStats(organizationId);
      return NextResponse.json(stats);
    }

    const result = await listLeads(organizationId, {
      status: searchParams.get("status") ?? undefined,
      source: searchParams.get("source") ?? undefined,
      branchId: searchParams.get("branchId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")!) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")!) : undefined,
    });
    return NextResponse.json(result);
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "LEADS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "updateStatus" && body.id) {
      const lead = await updateLeadStatus(body.id, organizationId, body.status, body.notes);
      return NextResponse.json({ lead });
    }

    if (body.action === "convert" && body.id && body.studentId) {
      const lead = await convertLead(body.id, organizationId, body.studentId);
      return NextResponse.json({ lead });
    }

    if (!body.studentName) {
      return NextResponse.json({ error: "studentName is required" }, { status: 400 });
    }

    const lead = await createLead({ ...body, organizationId });
    return NextResponse.json({ lead }, { status: 201 });
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}
