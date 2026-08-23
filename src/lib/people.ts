import { db } from "@/lib/prisma";
import { PersonStatus, type PersonType } from "@/lib/constants";

export type CreatePersonInput = {
  organizationId: string;
  branchId?: string;
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

type UpdatePersonInput = Partial<CreatePersonInput>;

type PersonFilter = {
  organizationId: string;
  branchId?: string;
  status?: PersonStatus;
  search?: string;
  type?: PersonType;
  page?: number;
  limit?: number;
};

export async function createPerson(input: CreatePersonInput) {
  return db.person.create({
    data: {
      organizationId: input.organizationId,
      branchId: input.branchId,
      firstName: input.firstName,
      lastName: input.lastName,
      middleName: input.middleName,
      email: input.email,
      phone: input.phone,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      gender: input.gender as "MALE" | "FEMALE" | "OTHER" | null,
      address: input.address,
      city: input.city,
      state: input.state,
      country: input.country,
    },
  });
}

export async function updatePerson(id: string, input: UpdatePersonInput) {
  return db.person.update({
    where: { id },
    data: {
      ...(input.firstName !== undefined && { firstName: input.firstName }),
      ...(input.lastName !== undefined && { lastName: input.lastName }),
      ...(input.middleName !== undefined && { middleName: input.middleName }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.dateOfBirth !== undefined && { dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null }),
      ...(input.gender !== undefined && { gender: input.gender as "MALE" | "FEMALE" | "OTHER" | null }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.state !== undefined && { state: input.state }),
      ...(input.country !== undefined && { country: input.country }),
      ...(input.branchId !== undefined && { branchId: input.branchId }),
    },
  });
}

export async function archivePerson(id: string) {
  return db.person.update({
    where: { id },
    data: {
      status: PersonStatus.ARCHIVED,
      archivedAt: new Date(),
    },
  });
}

export async function restorePerson(id: string) {
  return db.person.update({
    where: { id },
    data: {
      status: PersonStatus.ACTIVE,
      archivedAt: null,
    },
  });
}

export async function getPersonById(id: string) {
  return db.person.findUnique({
    where: { id },
    include: {
      student: true,
      staff: {
        include: {
          teacher: true,
          trainer: true,
        },
      },
      parent: true,
      guardianships: {
        include: {
          student: {
            include: {
              person: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
      },
      organization: { select: { id: true, name: true, type: true } },
      branch: { select: { id: true, name: true, code: true } },
    },
  });
}

export async function listPeople(filters: PersonFilter) {
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    organizationId: filters.organizationId,
  };

  if (filters.branchId) where.branchId = filters.branchId;
  if (filters.status) where.status = filters.status;

  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { phone: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.type) {
    if (filters.type === "STUDENT") where.student = { isNot: null };
    else if (filters.type === "TEACHER") where.staff = { teacher: { isNot: null } };
    else if (filters.type === "TRAINER") where.staff = { trainer: { isNot: null } };
    else if (filters.type === "PARENT") where.parent = { isNot: null };
    else if (filters.type === "STAFF") where.staff = { isNot: null };
  }

  const [people, total] = await Promise.all([
    db.person.findMany({
      where,
      include: {
        student: true,
        staff: { include: { teacher: true, trainer: true } },
        parent: true,
        branch: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.person.count({ where }),
  ]);

  return {
    people,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPersonTypeCounts(organizationId: string) {
  const counts = await Promise.all([
    db.student.count({ where: { organizationId } }),
    db.teacher.count({ where: { organizationId } }),
    db.trainer.count({ where: { organizationId } }),
    db.parent.count({ where: { organizationId } }),
    db.staff.count({ where: { organizationId } }),
  ]);

  return {
    students: counts[0],
    teachers: counts[1],
    trainers: counts[2],
    parents: counts[3],
    staff: counts[4],
  };
}
