import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { getStaffById, updateStaff, archiveStaff } from "@/lib/staff";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/staff/[id]">
) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "TEACHERS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;

    const staff = await getStaffById(id);
    if (!staff || staff.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ staff });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/staff/[id]">
) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "TEACHERS_UPDATE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const body = await request.json();

    const existing = await getStaffById(id);
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const staff = await updateStaff(id, {
      person: body.person,
      employeeId: body.employeeId,
      hireDate: body.hireDate,
      department: body.department,
      position: body.position,
      metadata: body.metadata,
    });

    return NextResponse.json({ staff });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext<"/api/staff/[id]">
) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "TEACHERS_DELETE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;

    const existing = await getStaffById(id);
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await archiveStaff(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
