import { db } from "@/lib/prisma";

export async function listTrainers(organizationId: string, params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.status) where.status = params.status;
  if (params?.search) {
    where.OR = [
      { specialization: { contains: params.search, mode: "insensitive" } },
      { staff: { person: { firstName: { contains: params.search, mode: "insensitive" } } } },
      { staff: { person: { lastName: { contains: params.search, mode: "insensitive" } } } },
      { staff: { person: { email: { contains: params.search, mode: "insensitive" } } } },
    ];
  }

  const [trainers, total] = await Promise.all([
    db.trainer.findMany({
      where,
      include: {
        staff: {
          include: {
            person: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.trainer.count({ where }),
  ]);

  return { trainers, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getTrainer(id: string, organizationId: string) {
  return db.trainer.findFirst({
    where: { id, organizationId },
    include: {
      staff: {
        include: {
          person: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, dateOfBirth: true, gender: true } },
        },
      },
    },
  });
}

export async function createTrainer(data: {
  organizationId: string;
  staffId: string;
  specialization?: string;
  hourlyRate?: number;
  employmentType?: string;
}) {
  return db.trainer.create({
    data: {
      organizationId: data.organizationId,
      staffId: data.staffId,
      specialization: data.specialization ?? null,
      hourlyRate: data.hourlyRate ?? null,
      employmentType: data.employmentType ?? null,
    },
  });
}

export async function updateTrainer(id: string, organizationId: string, data: Record<string, unknown>) {
  return db.trainer.updateMany({ where: { id, organizationId }, data });
}
