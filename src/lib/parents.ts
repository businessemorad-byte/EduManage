import { db } from "@/lib/prisma";
import { createPerson, updatePerson, archivePerson } from "./people";
import type { Prisma } from "@/generated/prisma/client";

type CreateParentInput = {
  organizationId: string;
  branchId?: string;
  person: {
    firstName: string;
    lastName: string;
    middleName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  occupation?: string;
  workplace?: string;
  metadata?: Record<string, unknown>;
};

type UpdateParentInput = {
  person?: Partial<CreateParentInput["person"]>;
  occupation?: string;
  workplace?: string;
  metadata?: Record<string, unknown>;
};

export async function createParent(input: CreateParentInput) {
  const person = await createPerson({
    ...input.person,
    organizationId: input.organizationId,
    branchId: input.branchId,
  });

  return db.parent.create({
    data: {
      personId: person.id,
      organizationId: input.organizationId,
      occupation: input.occupation,
      workplace: input.workplace,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
    include: { person: true },
  });
}

export async function updateParent(id: string, input: UpdateParentInput) {
  const parent = await db.parent.findUnique({ where: { id } });
  if (!parent) throw new Error("Parent not found");

  if (input.person) {
    await updatePerson(parent.personId, input.person);
  }

  return db.parent.update({
    where: { id },
    data: {
      ...(input.occupation !== undefined && { occupation: input.occupation }),
      ...(input.workplace !== undefined && { workplace: input.workplace }),
      ...(input.metadata !== undefined && { metadata: input.metadata as Prisma.InputJsonValue }),
    },
    include: { person: true },
  });
}

export async function archiveParent(id: string) {
  const parent = await db.parent.findUnique({ where: { id } });
  if (!parent) throw new Error("Parent not found");

  await archivePerson(parent.personId);
  return { success: true };
}

export async function getParentById(id: string) {
  return db.parent.findUnique({
    where: { id },
    include: {
      person: true,
      organization: { select: { id: true, name: true, type: true } },
    },
  });
}

export async function listParents(filters: {
  organizationId: string;
  branchId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    organizationId: filters.organizationId,
  };

  if (filters.branchId) where.person = { branchId: filters.branchId };

  if (filters.search) {
    where.person = {
      ...(where.person as Record<string, unknown>),
      OR: [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search, mode: "insensitive" } },
      ],
    };
  }

  const [parents, total] = await Promise.all([
    db.parent.findMany({
      where,
      include: {
        person: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.parent.count({ where }),
  ]);

  return {
    parents,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function linkParentToStudent(parentPersonId: string, studentId: string, relationship: string, isPrimary: boolean = false) {
  return db.studentGuardian.upsert({
    where: {
      studentId_personId: { studentId, personId: parentPersonId },
    },
    update: {
      relationship: relationship as "FATHER" | "MOTHER" | "GUARDIAN" | "OTHER",
      isPrimary,
    },
    create: {
      studentId,
      personId: parentPersonId,
      relationship: relationship as "FATHER" | "MOTHER" | "GUARDIAN" | "OTHER",
      isPrimary,
    },
  });
}

export async function unlinkParentFromStudent(parentPersonId: string, studentId: string) {
  return db.studentGuardian.delete({
    where: {
      studentId_personId: { studentId, personId: parentPersonId },
    },
  });
}
