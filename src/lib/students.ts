import { db } from "@/lib/prisma";
import { createPerson, updatePerson, archivePerson, type CreatePersonInput } from "./people";
import type { Prisma } from "@/generated/prisma/client";

type CreateStudentInput = {
  organizationId: string;
  branchId?: string;
  person: CreatePersonInput;
  studentId?: string;
  status?: string;
  enrollmentDate?: string;
  admissionDate?: string;
  nationality?: string;
  medicalNotes?: string;
  emergencyContact?: Record<string, unknown>;
  grade?: string;
  metadata?: Record<string, unknown>;
};

type UpdateStudentInput = {
  person?: Partial<CreatePersonInput>;
  studentId?: string;
  status?: string;
  enrollmentDate?: string;
  admissionDate?: string;
  nationality?: string;
  medicalNotes?: string;
  emergencyContact?: Record<string, unknown>;
  grade?: string;
  metadata?: Record<string, unknown>;
};

export async function createStudent(input: CreateStudentInput) {
  const person = await createPerson({
    ...input.person,
    organizationId: input.organizationId,
    branchId: input.branchId,
  });

  return db.student.create({
    data: {
      personId: person.id,
      organizationId: input.organizationId,
      studentId: input.studentId,
      status: (input.status as "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED" | "SUSPENDED" | "WITHDRAWN") ?? "ACTIVE",
      enrollmentDate: input.enrollmentDate ? new Date(input.enrollmentDate) : null,
      admissionDate: input.admissionDate ? new Date(input.admissionDate) : null,
      nationality: input.nationality ?? null,
      medicalNotes: input.medicalNotes ?? null,
      emergencyContact: input.emergencyContact as Prisma.InputJsonValue | undefined,
      grade: input.grade,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
    include: {
      person: true,
      guardians: { include: { person: true } },
    },
  });
}

export async function updateStudent(id: string, input: UpdateStudentInput) {
  const student = await db.student.findUnique({ where: { id } });
  if (!student) throw new Error("Student not found");

  if (input.person) {
    await updatePerson(student.personId, input.person);
  }

  return db.student.update({
    where: { id },
    data: {
      ...(input.studentId !== undefined && { studentId: input.studentId }),
      ...(input.status !== undefined && { status: input.status as "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED" | "SUSPENDED" | "WITHDRAWN" }),
      ...(input.enrollmentDate !== undefined && { enrollmentDate: input.enrollmentDate ? new Date(input.enrollmentDate) : null }),
      ...(input.admissionDate !== undefined && { admissionDate: input.admissionDate ? new Date(input.admissionDate) : null }),
      ...(input.nationality !== undefined && { nationality: input.nationality }),
      ...(input.medicalNotes !== undefined && { medicalNotes: input.medicalNotes }),
      ...(input.emergencyContact !== undefined && { emergencyContact: input.emergencyContact as Prisma.InputJsonValue }),
      ...(input.grade !== undefined && { grade: input.grade }),
      ...(input.metadata !== undefined && { metadata: input.metadata as Prisma.InputJsonValue }),
    },
    include: {
      person: true,
      guardians: { include: { person: true } },
    },
  });
}

export async function archiveStudent(id: string) {
  const student = await db.student.findUnique({ where: { id } });
  if (!student) throw new Error("Student not found");

  await archivePerson(student.personId);
  return { success: true };
}

export async function getStudentById(id: string) {
  return db.student.findUnique({
    where: { id },
    include: {
      person: true,
      organization: { select: { id: true, name: true, type: true } },
      guardians: {
        include: {
          person: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        },
      },
    },
  });
}

export async function listStudents(filters: {
  organizationId: string;
  branchId?: string;
  search?: string;
  grade?: string;
  status?: string;
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
  if (filters.grade) where.grade = filters.grade;
  if (filters.status) where.status = filters.status;

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

  const [students, total] = await Promise.all([
    db.student.findMany({
      where,
      include: {
        person: true,
        guardians: { include: { person: { select: { id: true, firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.student.count({ where }),
  ]);

  return {
    students,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function addGuardian(studentId: string, personId: string, relationship: string, isPrimary: boolean = false) {
  return db.studentGuardian.upsert({
    where: { studentId_personId: { studentId, personId } },
    update: { relationship: relationship as "FATHER" | "MOTHER" | "GUARDIAN" | "OTHER", isPrimary },
    create: { studentId, personId, relationship: relationship as "FATHER" | "MOTHER" | "GUARDIAN" | "OTHER", isPrimary },
  });
}

export async function removeGuardian(studentId: string, personId: string) {
  return db.studentGuardian.delete({
    where: { studentId_personId: { studentId, personId } },
  });
}

export async function getStudentGuardians(studentId: string) {
  return db.studentGuardian.findMany({
    where: { studentId },
    include: {
      person: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      },
    },
  });
}
