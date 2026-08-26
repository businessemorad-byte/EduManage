import { db } from "@/lib/prisma";
import { createPerson, updatePerson, archivePerson } from "./people";
import type { Prisma } from "@/generated/prisma/client";

type CreateStaffInput = {
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
  employeeId?: string;
  hireDate?: string;
  department?: string;
  position?: string;
  metadata?: Record<string, unknown>;
};

type CreateTeacherInput = CreateStaffInput & {
  subjects?: string[];
  qualification?: string;
  yearsExperience?: number;
};

type CreateTrainerInput = CreateStaffInput & {
  specialization?: string;
  certifications?: string[];
};

type UpdateStaffInput = {
  person?: Partial<CreateStaffInput["person"]>;
  employeeId?: string;
  hireDate?: string;
  department?: string;
  position?: string;
  metadata?: Record<string, unknown>;
};

export async function createStaff(input: CreateStaffInput) {
  const person = await createPerson({
    ...input.person,
    organizationId: input.organizationId,
    branchId: input.branchId,
  });

  return db.staff.create({
    data: {
      personId: person.id,
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      hireDate: input.hireDate ? new Date(input.hireDate) : null,
      department: input.department,
      position: input.position,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
    include: { person: true },
  });
}

export async function createTeacher(input: CreateTeacherInput) {
  const staff = await createStaff(input);

  return db.teacher.create({
    data: {
      staffId: staff.id,
      organizationId: input.organizationId,
      subjects: input.subjects,
      qualification: input.qualification,
      yearsExperience: input.yearsExperience,
    },
    include: { staff: { include: { person: true } } },
  });
}

export async function createTrainer(input: CreateTrainerInput) {
  const staff = await createStaff(input);

  return db.trainer.create({
    data: {
      staffId: staff.id,
      organizationId: input.organizationId,
      specialization: input.specialization,
      certifications: input.certifications,
    },
    include: { staff: { include: { person: true } } },
  });
}

export async function updateStaff(id: string, organizationId: string, input: UpdateStaffInput) {
  const staff = await db.staff.findUnique({ where: { id, organizationId } });
  if (!staff) throw new Error("Staff not found");

  if (input.person) {
    await updatePerson(staff.personId, input.person);
  }

  return db.staff.update({
    where: { id },
    data: {
      ...(input.employeeId !== undefined && { employeeId: input.employeeId }),
      ...(input.hireDate !== undefined && { hireDate: input.hireDate ? new Date(input.hireDate) : null }),
      ...(input.department !== undefined && { department: input.department }),
      ...(input.position !== undefined && { position: input.position }),
      ...(input.metadata !== undefined && { metadata: input.metadata as Prisma.InputJsonValue }),
    },
    include: { person: true },
  });
}

export async function archiveStaff(id: string, organizationId: string) {
  const staff = await db.staff.findUnique({ where: { id, organizationId } });
  if (!staff) throw new Error("Staff not found");

  await archivePerson(staff.personId);
  return { success: true };
}

export async function getStaffById(id: string, organizationId: string) {
  return db.staff.findUnique({
    where: { id, organizationId },
    include: {
      person: true,
      organization: { select: { id: true, name: true, type: true } },
      teacher: true,
      trainer: true,
    },
  });
}

export async function listStaff(filters: {
  organizationId: string;
  branchId?: string;
  search?: string;
  department?: string;
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
  if (filters.department) where.department = filters.department;

  if (filters.search) {
    where.person = {
      ...(where.person as Record<string, unknown>),
      OR: [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ],
    };
  }

  const [staff, total] = await Promise.all([
    db.staff.findMany({
      where,
      include: {
        person: true,
        teacher: true,
        trainer: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.staff.count({ where }),
  ]);

  return {
    staff,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function listTeachers(filters: {
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

  if (filters.branchId) {
    where.staff = { person: { branchId: filters.branchId } };
  }

  if (filters.search) {
    where.staff = {
      ...(where.staff as Record<string, unknown>),
      person: {
        ...(typeof (where.staff as Record<string, unknown>)?.person === "object" && (where.staff as Record<string, unknown>).person !== null
          ? (where.staff as Record<string, unknown>).person as Record<string, unknown>
          : {}),
        OR: [
          { firstName: { contains: filters.search, mode: "insensitive" } },
          { lastName: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
        ],
      },
    };
  }

  const [teachers, total] = await Promise.all([
    db.teacher.findMany({
      where,
      include: {
        staff: {
          include: {
            person: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.teacher.count({ where }),
  ]);

  return {
    teachers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function listTrainers(filters: {
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

  if (filters.branchId) {
    where.staff = { person: { branchId: filters.branchId } };
  }

  if (filters.search) {
    where.staff = {
      ...(where.staff as Record<string, unknown>),
      person: {
        ...(typeof (where.staff as Record<string, unknown>)?.person === "object" && (where.staff as Record<string, unknown>).person !== null
          ? (where.staff as Record<string, unknown>).person as Record<string, unknown>
          : {}),
        OR: [
          { firstName: { contains: filters.search, mode: "insensitive" } },
          { lastName: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
        ],
      },
    };
  }

  const [trainers, total] = await Promise.all([
    db.trainer.findMany({
      where,
      include: {
        staff: {
          include: {
            person: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.trainer.count({ where }),
  ]);

  return {
    trainers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
