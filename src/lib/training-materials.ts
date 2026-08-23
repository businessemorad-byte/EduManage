import { db } from "@/lib/prisma";

export async function createTrainingMaterial(data: {
  organizationId: string;
  moduleId?: string;
  programId?: string;
  cohortId?: string;
  title: string;
  description?: string;
  type: string;
  fileUrl?: string;
  externalUrl?: string;
  fileSize?: number;
  mimeType?: string;
  sortOrder?: number;
}) {
  return db.trainingMaterial.create({
    data: {
      organizationId: data.organizationId,
      moduleId: data.moduleId ?? null,
      programId: data.programId ?? null,
      cohortId: data.cohortId ?? null,
      title: data.title,
      description: data.description ?? null,
      type: data.type,
      fileUrl: data.fileUrl ?? null,
      externalUrl: data.externalUrl ?? null,
      fileSize: data.fileSize ?? null,
      mimeType: data.mimeType ?? null,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

export async function listTrainingMaterials(organizationId: string, params?: { moduleId?: string; programId?: string; cohortId?: string }) {
  const where: Record<string, unknown> = { organizationId };
  if (params?.moduleId) where.moduleId = params.moduleId;
  if (params?.programId) where.programId = params.programId;
  if (params?.cohortId) where.cohortId = params.cohortId;

  return db.trainingMaterial.findMany({ where, orderBy: { sortOrder: "asc" } });
}

export async function deleteTrainingMaterial(id: string, organizationId: string) {
  return db.trainingMaterial.deleteMany({ where: { id, organizationId } });
}
