import { db } from "@/lib/prisma";

export async function createProgressNote(data: {
  organizationId: string;
  studentId: string;
  teacherId?: string;
  subjectId?: string;
  groupId?: string;
  content: string;
  category?: string;
  isPrivate?: boolean;
}) {
  return db.studentProgressNote.create({
    data: {
      organizationId: data.organizationId,
      studentId: data.studentId,
      teacherId: data.teacherId ?? null,
      subjectId: data.subjectId ?? null,
      groupId: data.groupId ?? null,
      content: data.content,
      category: data.category ?? "OBSERVATION",
      isPrivate: data.isPrivate ?? false,
    },
  });
}

export async function listProgressNotes(organizationId: string, params?: { studentId?: string; teacherId?: string; subjectId?: string; category?: string; page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.studentId) where.studentId = params.studentId;
  if (params?.teacherId) where.teacherId = params.teacherId;
  if (params?.subjectId) where.subjectId = params.subjectId;
  if (params?.category) where.category = params.category;

  const [notes, total] = await Promise.all([
    db.studentProgressNote.findMany({
      where,
      include: {
        student: { include: { person: { select: { firstName: true, lastName: true } } } },
        teacher: { include: { staff: { include: { person: { select: { firstName: true, lastName: true } } } } } },
        subject: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.studentProgressNote.count({ where }),
  ]);

  return { notes, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function deleteProgressNote(id: string, organizationId: string) {
  return db.studentProgressNote.delete({ where: { id, organizationId } });
}
