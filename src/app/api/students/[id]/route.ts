import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { getStudentById, updateStudent, archiveStudent } from "@/lib/students";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/students/[id]">
) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "STUDENTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;

    const student = await getStudentById(id);
    if (!student || student.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/students/[id]">
) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "STUDENTS_UPDATE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const body = await request.json();

    const existing = await getStudentById(id);
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const student = await updateStudent(id, {
      person: body.person,
      studentId: body.studentId,
      enrollmentDate: body.enrollmentDate,
      grade: body.grade,
      metadata: body.metadata,
    });

    return NextResponse.json({ student });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext<"/api/students/[id]">
) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "STUDENTS_DELETE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;

    const existing = await getStudentById(id);
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await archiveStudent(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
