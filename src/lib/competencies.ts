import { db } from "@/lib/prisma";
import { emitEvent, EVENT_TYPES } from "@/lib/events";

export async function createCompetency(data: {
  organizationId: string;
  moduleId?: string;
  programId?: string;
  name: string;
  description?: string;
  sortOrder?: number;
}) {
  return db.competency.create({
    data: {
      organizationId: data.organizationId,
      moduleId: data.moduleId ?? null,
      programId: data.programId ?? null,
      name: data.name,
      description: data.description ?? null,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

export async function listCompetencies(organizationId: string, params?: { moduleId?: string; programId?: string }) {
  const where: Record<string, unknown> = { organizationId };
  if (params?.moduleId) where.moduleId = params.moduleId;
  if (params?.programId) where.programId = params.programId;

  return db.competency.findMany({ where, orderBy: { sortOrder: "asc" } });
}

export async function updateCompetencyRecord(data: {
  organizationId: string;
  competencyId: string;
  studentId: string;
  status: string;
  score?: number;
  evaluatedBy?: string;
  notes?: string;
}) {
  const record = await db.competencyRecord.upsert({
    where: {
      organizationId_competencyId_studentId: {
        organizationId: data.organizationId,
        competencyId: data.competencyId,
        studentId: data.studentId,
      },
    },
    create: {
      organizationId: data.organizationId,
      competencyId: data.competencyId,
      studentId: data.studentId,
      status: data.status as never,
      score: data.score ?? null,
      evaluatedBy: data.evaluatedBy ?? null,
      evaluatedAt: new Date(),
      notes: data.notes ?? null,
    },
    update: {
      status: data.status as never,
      score: data.score ?? null,
      evaluatedBy: data.evaluatedBy ?? null,
      evaluatedAt: new Date(),
      notes: data.notes ?? null,
    },
  });

  if (data.status === "ACHIEVED" || data.status === "MASTERED") {
    await emitEvent({ type: EVENT_TYPES.COMPETENCY_ACHIEVED, organizationId: data.organizationId, payload: { competencyId: data.competencyId, studentId: data.studentId, status: data.status } });
  }

  return record;
}

export async function getStudentCompetencies(organizationId: string, studentId: string, params?: { moduleId?: string; programId?: string }) {
  const where: Record<string, unknown> = { organizationId, studentId };
  if (params?.moduleId) where.moduleId = params.moduleId;
  if (params?.programId) where.programId = params.programId;

  return db.competencyRecord.findMany({
    where: { organizationId, studentId },
    include: { competency: true },
    orderBy: { createdAt: "desc" },
  });
}
