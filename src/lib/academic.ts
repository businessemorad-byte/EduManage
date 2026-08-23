import { db } from "@/lib/prisma";
import type { EnrollmentStatus } from "@/generated/prisma/client";

// ─── Academic Year ───────────────────────────────────────────────

export async function createAcademicYear(data: {
  organizationId: string;
  name: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
}) {
  if (data.isCurrent) {
    await db.academicYear.updateMany({
      where: { organizationId: data.organizationId, isCurrent: true },
      data: { isCurrent: false },
    });
  }

  return db.academicYear.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      isCurrent: data.isCurrent ?? false,
    },
  });
}

export async function listAcademicYears(organizationId: string) {
  return db.academicYear.findMany({
    where: { organizationId },
    orderBy: { startDate: "desc" },
  });
}

export async function getCurrentAcademicYear(organizationId: string) {
  return db.academicYear.findFirst({
    where: { organizationId, isCurrent: true },
  });
}

export async function setCurrentAcademicYear(organizationId: string, id: string) {
  await db.academicYear.updateMany({
    where: { organizationId, isCurrent: true },
    data: { isCurrent: false },
  });
  return db.academicYear.update({
    where: { id },
    data: { isCurrent: true },
  });
}

export async function deleteAcademicYear(id: string) {
  return db.academicYear.delete({ where: { id } });
}

// ─── Level ───────────────────────────────────────────────────────

export async function createLevel(data: {
  organizationId: string;
  academicYearId?: string;
  name: string;
  code?: string;
  sortOrder?: number;
}) {
  return db.level.create({
    data: {
      organizationId: data.organizationId,
      academicYearId: data.academicYearId,
      name: data.name,
      code: data.code,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

export async function listLevels(organizationId: string, academicYearId?: string) {
  return db.level.findMany({
    where: {
      organizationId,
      ...(academicYearId ? { academicYearId } : {}),
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function deleteLevel(id: string) {
  return db.level.delete({ where: { id } });
}

// ─── Subject ─────────────────────────────────────────────────────

export async function createSubject(data: {
  organizationId: string;
  academicYearId?: string;
  levelId?: string;
  name: string;
  code?: string;
  description?: string;
}) {
  return db.subject.create({
    data: {
      organizationId: data.organizationId,
      academicYearId: data.academicYearId,
      levelId: data.levelId,
      name: data.name,
      code: data.code,
      description: data.description,
    },
  });
}

export async function listSubjects(organizationId: string, filters?: { academicYearId?: string; levelId?: string }) {
  return db.subject.findMany({
    where: {
      organizationId,
      ...(filters?.academicYearId ? { academicYearId: filters.academicYearId } : {}),
      ...(filters?.levelId ? { levelId: filters.levelId } : {}),
    },
    include: { level: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });
}

export async function deleteSubject(id: string) {
  return db.subject.delete({ where: { id } });
}

// ─── Program ─────────────────────────────────────────────────────

export async function createProgram(data: {
  organizationId: string;
  name: string;
  code?: string;
  description?: string;
}) {
  return db.program.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      code: data.code,
      description: data.description,
    },
  });
}

export async function listPrograms(organizationId: string) {
  return db.program.findMany({
    where: { organizationId },
    include: { _count: { select: { modules: true, groups: true } } },
    orderBy: { name: "asc" },
  });
}

export async function deleteProgram(id: string) {
  return db.program.delete({ where: { id } });
}

// ─── Module ──────────────────────────────────────────────────────

export async function createModule(data: {
  organizationId: string;
  programId?: string;
  subjectId?: string;
  name: string;
  code?: string;
  description?: string;
  sortOrder?: number;
}) {
  return db.module.create({
    data: {
      organizationId: data.organizationId,
      programId: data.programId,
      subjectId: data.subjectId,
      name: data.name,
      code: data.code,
      description: data.description,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

export async function listModules(organizationId: string, filters?: { programId?: string; subjectId?: string }) {
  return db.module.findMany({
    where: {
      organizationId,
      ...(filters?.programId ? { programId: filters.programId } : {}),
      ...(filters?.subjectId ? { subjectId: filters.subjectId } : {}),
    },
    include: {
      program: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function deleteModule(id: string) {
  return db.module.delete({ where: { id } });
}

// ─── Group ───────────────────────────────────────────────────────

export async function createGroup(data: {
  organizationId: string;
  branchId?: string;
  academicYearId?: string;
  levelId?: string;
  programId?: string;
  name: string;
  code?: string;
  capacity?: number;
}) {
  return db.group.create({
    data: {
      organizationId: data.organizationId,
      branchId: data.branchId,
      academicYearId: data.academicYearId,
      levelId: data.levelId,
      programId: data.programId,
      name: data.name,
      code: data.code,
      capacity: data.capacity,
    },
  });
}

export async function listGroups(organizationId: string, filters?: { academicYearId?: string; levelId?: string; programId?: string; branchId?: string }) {
  return db.group.findMany({
    where: {
      organizationId,
      ...(filters?.academicYearId ? { academicYearId: filters.academicYearId } : {}),
      ...(filters?.levelId ? { levelId: filters.levelId } : {}),
      ...(filters?.programId ? { programId: filters.programId } : {}),
      ...(filters?.branchId ? { branchId: filters.branchId } : {}),
    },
    include: {
      academicYear: { select: { id: true, name: true } },
      level: { select: { id: true, name: true } },
      program: { select: { id: true, name: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function deleteGroup(id: string) {
  return db.group.delete({ where: { id } });
}

// ─── Enrollment ──────────────────────────────────────────────────

export async function createEnrollment(data: {
  organizationId: string;
  branchId?: string;
  studentId: string;
  academicYearId?: string;
  programId?: string;
  subjectId?: string;
  groupId?: string;
  status?: EnrollmentStatus;
  startDate?: string;
}) {
  const active = await db.enrollment.findFirst({
    where: {
      studentId: data.studentId,
      organizationId: data.organizationId,
      status: "ACTIVE",
      ...(data.groupId ? { groupId: data.groupId } : {}),
    },
  });

  if (active) {
    await db.enrollment.update({
      where: { id: active.id },
      data: { status: "COMPLETED", endDate: new Date() },
    });
  }

  return db.enrollment.create({
    data: {
      organizationId: data.organizationId,
      branchId: data.branchId,
      studentId: data.studentId,
      academicYearId: data.academicYearId,
      programId: data.programId,
      subjectId: data.subjectId,
      groupId: data.groupId,
      status: data.status ?? "ACTIVE",
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
    },
    include: {
      student: { include: { person: { select: { id: true, firstName: true, lastName: true } } } },
      group: { select: { id: true, name: true } },
      academicYear: { select: { id: true, name: true } },
    },
  });
}

export async function updateEnrollment(id: string, data: { status?: EnrollmentStatus; groupId?: string; endDate?: string }) {
  return db.enrollment.update({
    where: { id },
    data: {
      ...(data.status !== undefined && { status: data.status }),
      ...(data.groupId !== undefined && { groupId: data.groupId }),
      ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
    },
  });
}

export async function listEnrollments(organizationId: string, filters?: {
  studentId?: string;
  groupId?: string;
  academicYearId?: string;
  programId?: string;
  status?: EnrollmentStatus;
  page?: number;
  limit?: number;
}) {
  const page = filters?.page ?? 1;
  const limit = Math.min(filters?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (filters?.studentId) where.studentId = filters.studentId;
  if (filters?.groupId) where.groupId = filters.groupId;
  if (filters?.academicYearId) where.academicYearId = filters.academicYearId;
  if (filters?.programId) where.programId = filters.programId;
  if (filters?.status) where.status = filters.status;

  const [enrollments, total] = await Promise.all([
    db.enrollment.findMany({
      where,
      include: {
        student: { include: { person: { select: { id: true, firstName: true, lastName: true } } } },
        group: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.enrollment.count({ where }),
  ]);

  return {
    enrollments,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getStudentEnrollments(studentId: string) {
  return db.enrollment.findMany({
    where: { studentId },
    include: {
      group: { select: { id: true, name: true } },
      academicYear: { select: { id: true, name: true } },
      program: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
