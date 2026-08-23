import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "STUDENTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;

    const enrollment = await db.enrollment.findFirst({
      where: { id, organizationId },
      include: {
        student: {
          include: { person: { select: { id: true, firstName: true, lastName: true } } },
        },
        group: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
    });
    if (!enrollment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ enrollment });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "STUDENTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const body = await request.json();

    const enrollment = await db.enrollment.findFirst({ where: { id, organizationId } });
    if (!enrollment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.enrollment.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.groupId && { groupId: body.groupId }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
      },
      include: {
        student: { include: { person: { select: { firstName: true, lastName: true } } } },
        group: { select: { name: true } },
        academicYear: { select: { name: true } },
        program: { select: { name: true } },
      },
    });

    return NextResponse.json({ enrollment: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
