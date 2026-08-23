import { db } from "@/lib/prisma";

export async function setTeacherAvailability(data: {
  organizationId: string;
  teacherId: string;
  branchId?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}) {
  return db.teacherAvailability.upsert({
    where: { organizationId_teacherId_dayOfWeek_startTime: { organizationId: data.organizationId, teacherId: data.teacherId, dayOfWeek: data.dayOfWeek as never, startTime: data.startTime } },
    create: {
      organizationId: data.organizationId,
      teacherId: data.teacherId,
      branchId: data.branchId ?? null,
      dayOfWeek: data.dayOfWeek as never,
      startTime: data.startTime,
      endTime: data.endTime,
      isAvailable: data.isAvailable ?? true,
    },
    update: { endTime: data.endTime, isAvailable: data.isAvailable ?? true, branchId: data.branchId ?? null },
  });
}

export async function getTeacherAvailability(organizationId: string, teacherId: string) {
  return db.teacherAvailability.findMany({
    where: { organizationId, teacherId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

export async function listTeacherAvailabilities(organizationId: string, params?: { branchId?: string; dayOfWeek?: string; page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 50, 200);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.branchId) where.branchId = params.branchId;
  if (params?.dayOfWeek) where.dayOfWeek = params.dayOfWeek;

  const [availabilities, total] = await Promise.all([
    db.teacherAvailability.findMany({
      where,
      include: {
        teacher: { include: { staff: { include: { person: { select: { firstName: true, lastName: true } } } } } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      skip,
      take: limit,
    }),
    db.teacherAvailability.count({ where }),
  ]);

  return { availabilities, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function deleteTeacherAvailability(id: string, organizationId: string) {
  return db.teacherAvailability.delete({ where: { id, organizationId } });
}

export async function checkTeacherConflict(organizationId: string, teacherId: string, dayOfWeek: string, startTime: string, endTime: string, excludeId?: string) {
  const conflicts = await db.teacherAvailability.findMany({
    where: {
      organizationId,
      teacherId,
      dayOfWeek: dayOfWeek as never,
      isAvailable: true,
      id: excludeId ? { not: excludeId } : undefined,
      OR: [
        { startTime: { lt: endTime }, endTime: { gt: startTime } },
      ],
    },
  });
  return conflicts;
}
