import { db } from "@/lib/prisma";
import { emitEvent, EVENT_TYPES } from "@/lib/events";

export async function createCohort(data: {
  organizationId: string;
  programId: string;
  name: string;
  branchId?: string;
  classTeacherId?: string;
  capacity?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const cohort = await db.group.create({
    data: {
      organizationId: data.organizationId,
      programId: data.programId,
      name: data.name,
      branchId: data.branchId ?? null,
      classTeacherId: data.classTeacherId ?? null,
      capacity: data.capacity ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      cohortStatus: "PLANNED",
    },
  });

  await emitEvent({ type: EVENT_TYPES.COHORT_CREATED, organizationId: data.organizationId, payload: { id: cohort.id, name: cohort.name, programId: data.programId } });
  return cohort;
}

export async function listCohorts(organizationId: string, params?: {
  programId?: string;
  status?: string;
  branchId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.programId) where.programId = params.programId;
  if (params?.status) where.cohortStatus = params.status;
  if (params?.branchId) where.branchId = params.branchId;
  if (params?.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { code: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [cohorts, total] = await Promise.all([
    db.group.findMany({
      where,
      include: {
        program: { select: { id: true, name: true } },
        classTeacher: { include: { staff: { include: { person: true } } } },
        branch: { select: { name: true } },
        enrollments: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.group.count({ where }),
  ]);

  return { cohorts, total, page, totalPages: Math.ceil(total / limit) };
}

export async function updateCohort(id: string, organizationId: string, data: Record<string, unknown>) {
  return db.group.updateMany({ where: { id, organizationId }, data });
}

export async function enrollInCohort(cohortId: string, studentId: string, organizationId: string) {
  const cohort = await db.group.findFirst({ where: { id: cohortId, organizationId } });
  if (!cohort) throw new Error("Cohort not found");

  if (cohort.capacity) {
    const enrolledCount = await db.enrollment.count({ where: { groupId: cohortId, status: "ACTIVE" } });
    if (enrolledCount >= cohort.capacity) throw new Error("Cohort is at full capacity");
  }

  const existing = await db.enrollment.findFirst({ where: { studentId, groupId: cohortId, status: "ACTIVE" } });
  if (existing) throw new Error("Student is already enrolled in this cohort");

  const enrollment = await db.enrollment.create({
    data: {
      organizationId,
      studentId,
      groupId: cohortId,
      programId: cohort.programId,
      status: "ACTIVE",
    },
  });

  await emitEvent({ type: EVENT_TYPES.COHORT_ENROLLMENT, organizationId, payload: { cohortId, studentId, enrollmentId: enrollment.id } });
  return enrollment;
}
