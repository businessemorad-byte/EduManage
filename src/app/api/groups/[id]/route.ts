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
    const allowed = await hasPermission(user.id, organizationId, "ROOMS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;

    const group = await db.group.findFirst({
      where: { id, organizationId },
      include: {
        academicYear: { select: { id: true, name: true } },
        level: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        classTeacher: {
          select: {
            id: true,
            staff: { select: { person: { select: { id: true, firstName: true, lastName: true } } } },
          },
        },
        _count: { select: { enrollments: true, classSessions: true, assessments: true, homeworks: true } },
      },
    });
    if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const enrollments = await db.enrollment.findMany({
      where: { groupId: id, status: "ACTIVE" },
      include: {
        student: {
          include: { person: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ group: { ...group, enrollments } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "ROOMS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;

    const group = await db.group.findFirst({ where: { id, organizationId } });
    if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.group.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
