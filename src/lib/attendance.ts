import { db } from "@/lib/prisma";
import type { AttendanceStatus } from "@/generated/prisma/client";
import { emitEvent, EVENT_TYPES } from "@/lib/events";

// ─── Attendance CRUD ─────────────────────────────────────────────

export type AttendanceInput = {
  organizationId: string;
  studentId: string;
  classSessionId?: string;
  groupId?: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
};

export async function markAttendance(data: AttendanceInput) {
  // Tenant isolation: refuse to write attendance for a student of another organization.
  const student = await db.student.findFirst({
    where: { id: data.studentId, organizationId: data.organizationId },
    select: { id: true },
  });
  if (!student) throw new Error("Student not found in this organization");

  const date = new Date(data.date);
  date.setHours(0, 0, 0, 0);

  const data_ = {
    status: data.status,
    notes: data.notes ?? null,
    classSessionId: data.classSessionId ?? null,
  };

  // groupId/classSessionId are nullable parts of the unique constraints —
  // NULL never equals a sentinel "" in SQL, so match explicitly via findFirst.
  const result = await db.$transaction(async (tx) => {
    const existing = await tx.attendanceRecord.findFirst({
      where: {
        organizationId: data.organizationId,
        studentId: data.studentId,
        date,
        classSessionId: data.classSessionId ?? null,
        groupId: data.groupId ?? null,
      },
      select: { id: true },
    });
    if (existing) {
      return tx.attendanceRecord.update({ where: { id: existing.id }, data: data_ });
    }
    return tx.attendanceRecord.create({
      data: {
        organizationId: data.organizationId,
        studentId: data.studentId,
        groupId: data.groupId ?? null,
        date,
        ...data_,
      },
    });
  });

  if (data.status === "ABSENT") {
    await emitEvent({
      type: EVENT_TYPES.STUDENT_ABSENT,
      organizationId: data.organizationId,
      payload: { studentId: data.studentId, date, groupId: data.groupId },
    });
  } else if (data.status === "LATE") {
    await emitEvent({
      type: EVENT_TYPES.STUDENT_LATE,
      organizationId: data.organizationId,
      payload: { studentId: data.studentId, date, groupId: data.groupId },
    });
  }
  return result;
}

export type BatchAttendanceResult = {
  marked: Awaited<ReturnType<typeof markAttendance>>[];
  failed: { index: number; error: string }[];
};

export async function markBatchAttendance(records: AttendanceInput[]): Promise<BatchAttendanceResult> {
  const marked: BatchAttendanceResult["marked"] = [];
  const failed: BatchAttendanceResult["failed"] = [];
  for (let i = 0; i < records.length; i++) {
    try {
      marked.push(await markAttendance(records[i]));
    } catch (err) {
      failed.push({ index: i, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }
  return { marked, failed };
}

export async function listAttendance(params: {
  organizationId: string;
  groupId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
}) {
  const where: Record<string, unknown> = { organizationId: params.organizationId };

  if (params.groupId) where.groupId = params.groupId;
  if (params.studentId) where.studentId = params.studentId;
  if (params.status) where.status = params.status;

  if (params.startDate || params.endDate) {
    where.date = {
      ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
      ...(params.endDate ? { lte: new Date(params.endDate) } : {}),
    };
  }

  return db.attendanceRecord.findMany({
    where,
    include: {
      student: { include: { person: { select: { firstName: true, lastName: true } } } },
      group: { select: { name: true } },
      classSession: { select: { dayOfWeek: true, startTime: true, endTime: true } },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}

export async function getAttendanceSummary(params: {
  organizationId: string;
  studentId: string;
  startDate?: string;
  endDate?: string;
}) {
  const where: Record<string, unknown> = {
    organizationId: params.organizationId,
    studentId: params.studentId,
  };

  if (params.startDate || params.endDate) {
    where.date = {
      ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
      ...(params.endDate ? { lte: new Date(params.endDate) } : {}),
    };
  }

  const records = await db.attendanceRecord.findMany({ where });

  const summary = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0, total: records.length };
  for (const r of records) {
    summary[r.status]++;
  }

  return summary;
}

export async function getAbsenceHistory(params: {
  organizationId: string;
  studentId: string;
  limit?: number;
}) {
  return db.attendanceRecord.findMany({
    where: {
      organizationId: params.organizationId,
      studentId: params.studentId,
      status: { in: ["ABSENT", "LATE", "EXCUSED"] },
    },
    include: {
      group: { select: { name: true } },
      classSession: { select: { dayOfWeek: true, startTime: true, endTime: true } },
    },
    orderBy: { date: "desc" },
    take: params.limit ?? 50,
  });
}

// ─── Hooks / Events (delegates to central bus) ─────────────────

export type AttendanceEvent = {
  type: "student.absent" | "student.late";
  studentId: string;
  organizationId: string;
  date: Date;
  groupId?: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- deprecated: use onEvent() from @/lib/events instead
export function onAttendanceEvent(_handler: (event: AttendanceEvent) => void | Promise<void>) {}

export async function emitAttendanceEvent(event: AttendanceEvent) {
  await emitEvent({
    type: event.type,
    organizationId: event.organizationId,
    payload: { studentId: event.studentId, date: event.date, groupId: event.groupId },
  });
}
