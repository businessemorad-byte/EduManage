import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { calculateTeacherCompensation, listCompensations, updateCompensationStatus, getTeacherWorkload } from "@/lib/teacher-compensation";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "COMPENSATION_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    if (searchParams.get("action") === "workload" && searchParams.get("teacherId")) {
      const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);
      const year = Number(searchParams.get("year") ?? new Date().getFullYear());
      const workload = await getTeacherWorkload(organizationId, searchParams.get("teacherId")!, month, year);
      return NextResponse.json(workload);
    }

    const result = await listCompensations(organizationId, {
      teacherId: searchParams.get("teacherId") ?? undefined,
      month: searchParams.get("month") ? Number(searchParams.get("month")) : undefined,
      year: searchParams.get("year") ? Number(searchParams.get("year")) : undefined,
      status: searchParams.get("status") ?? undefined,
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
    const allowed = await hasPermission(user.id, organizationId, "COMPENSATION_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "updateStatus" && body.id && body.status) {
      const comp = await updateCompensationStatus(body.id, organizationId, body.status, body.notes);
      return NextResponse.json({ compensation: comp });
    }

    if (!body.teacherId || !body.month || !body.year) {
      return NextResponse.json({ error: "teacherId, month, and year are required" }, { status: 400 });
    }

    const comp = await calculateTeacherCompensation({ ...body, organizationId });
    return NextResponse.json({ compensation: comp }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
