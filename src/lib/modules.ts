import { db } from "@/lib/prisma";

export async function listModules(organizationId: string, params?: {
  programId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.programId) where.programId = params.programId;
  if (params?.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { code: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [modules, total] = await Promise.all([
    db.module.findMany({
      where,
      include: {
        program: { select: { id: true, name: true } },
        _count: { select: { classSessions: true, assessments: true, trainingMaterials: true } },
      },
      skip,
      take: limit,
      orderBy: { sortOrder: "asc" },
    }),
    db.module.count({ where }),
  ]);

  return { modules, total, page, totalPages: Math.ceil(total / limit) };
}

export async function createModule(data: {
  organizationId: string;
  programId: string;
  name: string;
  code?: string;
  description?: string;
  objectives?: string;
  duration?: string;
  prerequisites?: string;
  sortOrder?: number;
}) {
  return db.module.create({
    data: {
      organizationId: data.organizationId,
      programId: data.programId,
      name: data.name,
      code: data.code ?? null,
      description: data.description ?? null,
      objectives: data.objectives ?? null,
      duration: data.duration ?? null,
      prerequisites: data.prerequisites ?? null,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

export async function updateModule(id: string, organizationId: string, data: Record<string, unknown>) {
  return db.module.updateMany({ where: { id, organizationId }, data });
}
