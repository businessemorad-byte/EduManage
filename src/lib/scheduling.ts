import { db } from "@/lib/prisma";
import type { DayOfWeek } from "@/generated/prisma/client";

// ─── Conflict Detection ──────────────────────────────────────────

export type ConflictError = {
  type: "TEACHER_CONFLICT" | "ROOM_CONFLICT" | "GROUP_CONFLICT" | "ROOM_CAPACITY";
  message: string;
  conflictingSession?: { id: string; dayOfWeek: string; startTime: string; endTime: string };
};

function timeOverlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export async function checkConflicts(params: {
  organizationId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  teacherId?: string | null;
  roomId: string;
  groupId?: string | null;
  excludeSessionId?: string;
}): Promise<ConflictError[]> {
  const where: Record<string, unknown> = {
    organizationId: params.organizationId,
    isActive: true,
    dayOfWeek: params.dayOfWeek,
    id: params.excludeSessionId ? { not: params.excludeSessionId } : undefined,
  };

  const sessions = await db.classSession.findMany({ where });

  const conflicts: ConflictError[] = [];

  for (const s of sessions) {
    if (!timeOverlaps(params.startTime, params.endTime, s.startTime, s.endTime)) continue;

    if (params.teacherId && s.teacherId === params.teacherId) {
      conflicts.push({
        type: "TEACHER_CONFLICT",
        message: `Teacher is already assigned to a session at ${s.startTime}–${s.endTime}`,
        conflictingSession: { id: s.id, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime },
      });
    }

    if (s.roomId === params.roomId) {
      conflicts.push({
        type: "ROOM_CONFLICT",
        message: `Room is already booked at ${s.startTime}–${s.endTime}`,
        conflictingSession: { id: s.id, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime },
      });
    }

    if (params.groupId && s.groupId === params.groupId) {
      conflicts.push({
        type: "GROUP_CONFLICT",
        message: `Group already has a session at ${s.startTime}–${s.endTime}`,
        conflictingSession: { id: s.id, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime },
      });
    }
  }

  if (params.groupId) {
    const group = await db.group.findUnique({ where: { id: params.groupId }, select: { capacity: true } });
    const room = await db.room.findUnique({ where: { id: params.roomId }, select: { capacity: true } });
    if (group?.capacity && room?.capacity && group.capacity > room.capacity) {
      conflicts.push({
        type: "ROOM_CAPACITY",
        message: `Group size (${group.capacity}) exceeds room capacity (${room.capacity})`,
      });
    }
  }

  return conflicts;
}

// ─── Session CRUD ────────────────────────────────────────────────

export async function createSession(data: {
  organizationId: string;
  scheduleId?: string;
  groupId?: string;
  teacherId?: string;
  roomId: string;
  subjectId?: string;
  moduleId?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate?: string;
  isRecurring?: boolean;
}) {
  const conflicts = await checkConflicts({
    organizationId: data.organizationId,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
    teacherId: data.teacherId,
    roomId: data.roomId,
    groupId: data.groupId,
  });

  if (conflicts.length > 0) {
    const err = new Error("Schedule conflict detected") as Error & { conflicts: ConflictError[] };
    err.conflicts = conflicts;
    throw err;
  }

  return db.classSession.create({
    data: {
      organizationId: data.organizationId,
      scheduleId: data.scheduleId ?? null,
      groupId: data.groupId ?? null,
      teacherId: data.teacherId ?? null,
      roomId: data.roomId,
      subjectId: data.subjectId ?? null,
      moduleId: data.moduleId ?? null,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      isRecurring: data.isRecurring ?? true,
    },
  });
}

export async function updateSession(
  id: string,
  organizationId: string,
  data: {
    groupId?: string;
    teacherId?: string;
    roomId?: string;
    subjectId?: string;
    moduleId?: string;
    dayOfWeek?: DayOfWeek;
    startTime?: string;
    endTime?: string;
    startDate?: string;
    endDate?: string;
    isRecurring?: boolean;
  }
) {
  const current = await db.classSession.findFirst({ where: { id, organizationId } });
  if (!current) throw new Error("Session not found");

  const merged = {
    dayOfWeek: data.dayOfWeek ?? current.dayOfWeek,
    startTime: data.startTime ?? current.startTime,
    endTime: data.endTime ?? current.endTime,
    teacherId: data.teacherId ?? current.teacherId,
    roomId: data.roomId ?? current.roomId,
    groupId: data.groupId ?? current.groupId,
  };

  const conflicts = await checkConflicts({
    organizationId,
    dayOfWeek: merged.dayOfWeek,
    startTime: merged.startTime,
    endTime: merged.endTime,
    teacherId: merged.teacherId,
    roomId: merged.roomId,
    groupId: merged.groupId,
    excludeSessionId: id,
  });

  if (conflicts.length > 0) {
    const err = new Error("Schedule conflict detected") as Error & { conflicts: ConflictError[] };
    err.conflicts = conflicts;
    throw err;
  }

  return db.classSession.update({
    where: { id },
    data: {
      ...(data.groupId !== undefined && { groupId: data.groupId ?? null }),
      ...(data.teacherId !== undefined && { teacherId: data.teacherId ?? null }),
      ...(data.roomId !== undefined && { roomId: data.roomId }),
      ...(data.subjectId !== undefined && { subjectId: data.subjectId ?? null }),
      ...(data.moduleId !== undefined && { moduleId: data.moduleId ?? null }),
      ...(data.dayOfWeek !== undefined && { dayOfWeek: data.dayOfWeek }),
      ...(data.startTime !== undefined && { startTime: data.startTime }),
      ...(data.endTime !== undefined && { endTime: data.endTime }),
      ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
      ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
    },
  });
}

export async function deleteSession(id: string, organizationId: string) {
  const session = await db.classSession.findFirst({ where: { id, organizationId } });
  if (!session) throw new Error("Session not found");
  return db.classSession.update({ where: { id }, data: { isActive: false } });
}

export async function listSessions(
  organizationId: string,
  filters?: {
    scheduleId?: string;
    groupId?: string;
    teacherId?: string;
    roomId?: string;
    dayOfWeek?: DayOfWeek;
    startDate?: string;
    endDate?: string;
  }
) {
  return db.classSession.findMany({
    where: {
      organizationId,
      isActive: true,
      ...(filters?.scheduleId ? { scheduleId: filters.scheduleId } : {}),
      ...(filters?.groupId ? { groupId: filters.groupId } : {}),
      ...(filters?.teacherId ? { teacherId: filters.teacherId } : {}),
      ...(filters?.roomId ? { roomId: filters.roomId } : {}),
      ...(filters?.dayOfWeek ? { dayOfWeek: filters.dayOfWeek } : {}),
    },
    include: {
      group: { select: { id: true, name: true } },
      teacher: { select: { id: true, staff: { select: { person: { select: { firstName: true, lastName: true } } } } } },
      room: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      module: { select: { id: true, name: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

export async function getTimetable(organizationId: string, filters?: { groupId?: string; teacherId?: string; roomId?: string }) {
  return listSessions(organizationId, filters);
}

// ─── Schedule ────────────────────────────────────────────────────

export async function createSchedule(data: {
  organizationId: string;
  name: string;
  academicYearId?: string;
}) {
  return db.schedule.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      academicYearId: data.academicYearId ?? null,
    },
  });
}

export async function listSchedules(organizationId: string) {
  return db.schedule.findMany({
    where: { organizationId },
    include: { _count: { select: { classSessions: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteSchedule(id: string, organizationId: string) {
  const schedule = await db.schedule.findFirst({ where: { id, organizationId } });
  if (!schedule) throw new Error("Schedule not found");
  return db.schedule.delete({ where: { id } });
}
