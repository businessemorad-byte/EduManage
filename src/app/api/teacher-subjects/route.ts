import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "TEACHERS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    const where: Record<string, unknown> = { organizationId };
    if (searchParams.get("teacherId")!) where.teacherId = searchParams.get("teacherId")!;
    if (searchParams.get("subjectId")!) where.subjectId = searchParams.get("subjectId")!;
    if (searchParams.get("groupId")!) where.groupId = searchParams.get("groupId")!;

    const assignments = await db.teacherSubject.findMany({
      where,
      include: {
        teacher: { include: { staff: { include: { person: { select: { firstName: true, lastName: true } } } } } },
        subject: { select: { name: true, id: true } },
        group: { select: { name: true, id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ assignments });
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
    const allowed = await hasPermission(user.id, organizationId, "TEACHERS_UPDATE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (!body.teacherId || !body.subjectId) {
      return NextResponse.json({ error: "teacherId and subjectId are required" }, { status: 400 });
    }

    const assignment = await db.teacherSubject.upsert({
      where: {
        organizationId_teacherId_subjectId_groupId: {
          organizationId,
          teacherId: body.teacherId,
          subjectId: body.subjectId,
          groupId: body.groupId ?? null,
        },
      },
      create: {
        organizationId,
        teacherId: body.teacherId,
        subjectId: body.subjectId,
        groupId: body.groupId ?? null,
      },
      update: {},
      include: {
        teacher: { include: { staff: { include: { person: { select: { firstName: true, lastName: true } } } } } },
        subject: { select: { name: true } },
        group: { select: { name: true } },
      },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "TEACHERS_UPDATE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")!;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const assignment = await db.teacherSubject.findFirst({ where: { id, organizationId } });
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    await db.teacherSubject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}
