import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { markAttendance, markBatchAttendance, listAttendance, getAttendanceSummary, getAbsenceHistory } from "@/lib/attendance";
import type { AttendanceStatus } from "@/generated/prisma/client";

const VALID_ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED", "PARTIAL"];

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "ATTENDANCE_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    if (searchParams.get("summary")! === "true") {
      const studentId = searchParams.get("studentId")!;
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

    if (searchParams.get("absences")! === "true") {
      const studentId = searchParams.get("studentId")!;
      if (!studentId) {
        return NextResponse.json({ error: "studentId required for absences" }, { status: 400 });
      }
      const rawLimit = searchParams.get("limit")!;
      const limit = rawLimit ? Math.min(Math.max(1, Number(rawLimit) || 100), 500) : undefined;
      const absences = await getAbsenceHistory({
        organizationId,
        studentId,
        limit,
      });
      return NextResponse.json({ absences });
    }

    const statusFilter = searchParams.get("status")! as string | undefined;
    if (statusFilter && !VALID_ATTENDANCE_STATUSES.includes(statusFilter)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const records = await listAttendance({
      organizationId,
      groupId: searchParams.get("groupId") ?? undefined,
      studentId: searchParams.get("studentId") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      status: statusFilter as AttendanceStatus | undefined,
    });

    return NextResponse.json({ records });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
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
        status: r.status as string,
        notes: r.notes as string | undefined,
      })).filter((r: { studentId: string; date: string; status: string }) => {
        return r.studentId && r.date && VALID_ATTENDANCE_STATUSES.includes(r.status);
      });
      const results = await markBatchAttendance(records);
      return NextResponse.json(results, { status: 201 });
    }

    if (!body.studentId || !body.date || !body.status) {
      return NextResponse.json(
        { error: "studentId, date, status are required" },
        { status: 400 }
      );
    }

    if (!VALID_ATTENDANCE_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_ATTENDANCE_STATUSES.join(", ")}` }, { status: 400 });
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
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
