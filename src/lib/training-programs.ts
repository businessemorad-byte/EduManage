import { db } from "@/lib/prisma";
import { emitEvent, EVENT_TYPES } from "@/lib/events";

export async function createTrainingProgram(data: {
  organizationId: string;
  name: string;
  code?: string;
  description?: string;
  trainingCategory?: string;
  duration?: string;
  level?: string;
  objectives?: string;
  prerequisites?: string;
  price?: number;
  certificateEligibility?: boolean;
  branchId?: string;
  programStatus?: string;
}) {
  const program = await db.program.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      code: data.code ?? null,
      description: data.description ?? null,
      trainingCategory: data.trainingCategory ?? null,
      duration: data.duration ?? null,
      level: data.level ?? null,
      objectives: data.objectives ?? null,
      prerequisites: data.prerequisites ?? null,
      price: data.price ?? null,
      certificateEligibility: data.certificateEligibility ?? false,
      branchId: data.branchId ?? null,
      programStatus: data.programStatus ?? "DRAFT",
    },
  });

  await emitEvent({ type: EVENT_TYPES.PROGRAM_CREATED, organizationId: data.organizationId, payload: { id: program.id, name: program.name } });
  return program;
}

export async function listTrainingPrograms(organizationId: string, params?: {
  status?: string;
  category?: string;
  branchId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.status) where.programStatus = params.status;
  if (params?.category) where.trainingCategory = params.category;
  if (params?.branchId) where.branchId = params.branchId;
  if (params?.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { code: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [programs, total] = await Promise.all([
    db.program.findMany({
      where,
      include: { modules: true, groups: true, enrollments: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.program.count({ where }),
  ]);

  return { programs, total, page, totalPages: Math.ceil(total / limit) };
}

export async function updateTrainingProgram(id: string, organizationId: string, data: Record<string, unknown>) {
  return db.program.updateMany({ where: { id, organizationId }, data });
}
