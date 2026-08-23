import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { markAttendance, markBatchAttendance, listAttendance, getAttendanceSummary, getAbsenceHistory } from "@/lib/attendance";
import type { AttendanceStatus } from "@/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "ATTENDANCE_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    if (searchParams.get("summary") === "true") {
      const studentId = searchParams.get("studentId");
      if (!studentId) {
        return NextResponse.json({ error: "studentId required for summary" }, { status: 400 });
      }
      const summary = await getAttendanceSummary({
        organizationId,
        studentId,
        startDate: searchParams.get("startDate") ?? undefined,
        endDate: searchParams.get("endDate") ?? undefined,
      });
      return NextResponse.json({ summary });
    }

    if (searchParams.get("absences") === "true") {
      const studentId = searchParams.get("studentId");
      if (!studentId) {
        return NextResponse.json({ error: "studentId required for absences" }, { status: 400 });
      }
      const absences = await getAbsenceHistory({
        organizationId,
        studentId,
        limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      });
      return NextResponse.json({ absences });
    }

    const records = await listAttendance({
      organizationId,
      groupId: searchParams.get("groupId") ?? undefined,
      studentId: searchParams.get("studentId") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      status: searchParams.get("status") as AttendanceStatus | undefined,
    });

    return NextResponse.json({ records });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "ATTENDANCE_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.records && Array.isArray(body.records)) {
      const records = body.records.map((r: Record<string, unknown>) => ({
        organizationId,
        studentId: r.studentId as string,
        classSessionId: r.classSessionId as string | undefined,
        groupId: r.groupId as string | undefined,
        date: r.date as string,
        status: r.status as AttendanceStatus,
        notes: r.notes as string | undefined,
      }));
      const results = await markBatchAttendance(records);
      return NextResponse.json(results, { status: 201 });
    }

    if (!body.studentId || !body.date || !body.status) {
      return NextResponse.json(
        { error: "studentId, date, status are required" },
        { status: 400 }
      );
    }

    const record = await markAttendance({
      organizationId,
      studentId: body.studentId,
      classSessionId: body.classSessionId,
      groupId: body.groupId,
      date: body.date,
      status: body.status,
      notes: body.notes,
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
