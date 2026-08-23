import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createTrialSession, listTrialSessions, updateTrialStatus } from "@/lib/trials";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "TRIALS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    const result = await listTrialSessions(organizationId, {
      status: searchParams.get("status") ?? undefined,
      leadId: searchParams.get("leadId") ?? undefined,
      teacherId: searchParams.get("teacherId") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    });
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
    const allowed = await hasPermission(user.id, organizationId, "TRIALS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "updateStatus" && body.id) {
      const trial = await updateTrialStatus(body.id, organizationId, body.status, {
        attended: body.attended,
        result: body.result,
        notes: body.notes,
      });
      return NextResponse.json({ trial });
    }

    if (!body.leadId || !body.scheduledDate || !body.startTime || !body.endTime) {
      return NextResponse.json({ error: "leadId, scheduledDate, startTime, and endTime are required" }, { status: 400 });
    }

    const trial = await createTrialSession({ ...body, organizationId, scheduledDate: new Date(body.scheduledDate) });
    return NextResponse.json({ trial }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
