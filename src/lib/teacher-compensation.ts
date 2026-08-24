import { db } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function calculateTeacherCompensation(data: {
  organizationId: string;
  teacherId: string;
  month: number;
  year: number;
  branchId?: string;
}) {
  const teacher = await db.teacher.findFirst({ where: { id: data.teacherId, organizationId: data.organizationId } });
  if (!teacher) throw new Error("Teacher not found");

  const hourlyRate = teacher.hourlyRate ?? new Prisma.Decimal(0);

  const startOfMonth = new Date(data.year, data.month - 1, 1);
  const endOfMonth = new Date(data.year, data.month, 0, 23, 59, 59);

  const sessions = await db.classSession.findMany({
    where: {
      organizationId: data.organizationId,
      teacherId: data.teacherId,
      isActive: true,
      startDate: { lte: endOfMonth },
      OR: [{ endDate: null }, { endDate: { gte: startOfMonth } }],
      ...(data.branchId ? { room: { branchId: data.branchId } } : {}),
    },
  });

  let totalMinutes = 0;
  for (const s of sessions) {
    const [sh, sm] = s.startTime.split(":").map(Number);
    const [eh, em] = s.endTime.split(":").map(Number);
    totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
  }

  const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
  const grossAmount = hourlyRate.mul(totalHours);
  const netAmount = grossAmount;

  const compensation = await db.teacherCompensation.upsert({
    where: { organizationId_teacherId_month_year: { organizationId: data.organizationId, teacherId: data.teacherId, month: data.month, year: data.year } },
    create: {
      organizationId: data.organizationId,
      teacherId: data.teacherId,
      branchId: data.branchId ?? null,
      month: data.month,
      year: data.year,
      hourlyRate,
      totalHours: new Prisma.Decimal(totalHours),
      totalSessions: sessions.length,
      grossAmount,
      adjustments: new Prisma.Decimal(0),
      netAmount,
      status: "PENDING",
    },
    update: {
      hourlyRate,
      totalHours: new Prisma.Decimal(totalHours),
      totalSessions: sessions.length,
      grossAmount,
      netAmount,
    },
  });

  return compensation;
}

export async function listCompensations(organizationId: string, params?: { teacherId?: string; month?: number; year?: number; status?: string; page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.teacherId) where.teacherId = params.teacherId;
  if (params?.month) where.month = params.month;
  if (params?.year) where.year = params.year;
  if (params?.status) where.status = params.status;

  const [compensations, total] = await Promise.all([
    db.teacherCompensation.findMany({
      where,
      include: {
        teacher: { include: { staff: { include: { person: { select: { firstName: true, lastName: true } } } } } },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      skip,
      take: limit,
    }),
    db.teacherCompensation.count({ where }),
  ]);

  return { compensations, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function updateCompensationStatus(id: string, organizationId: string, status: string, notes?: string) {
  return db.teacherCompensation.update({
    where: { id, organizationId },
    data: { status: status as never, ...(notes !== undefined ? { notes } : {}) },
  });
}

export async function getTeacherWorkload(organizationId: string, teacherId: string, month: number, year: number) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const sessions = await db.classSession.findMany({
    where: {
      organizationId,
      teacherId,
      isActive: true,
      startDate: { lte: endOfMonth },
      OR: [{ endDate: null }, { endDate: { gte: startOfMonth } }],
    },
    include: {
      group: { select: { name: true } },
      subject: { select: { name: true } },
      room: { select: { name: true } },
    },
  });

  let totalMinutes = 0;
  const groupSet = new Set<string>();
  const subjectSet = new Set<string>();

  for (const s of sessions) {
    const [sh, sm] = s.startTime.split(":").map(Number);
    const [eh, em] = s.endTime.split(":").map(Number);
    totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
    if (s.group) groupSet.add(s.group.name);
    if (s.subject) subjectSet.add(s.subject.name);
  }

  return {
    totalHours: Math.round((totalMinutes / 60) * 100) / 100,
    totalSessions: sessions.length,
    groups: Array.from(groupSet),
    subjects: Array.from(subjectSet),
  };
}


