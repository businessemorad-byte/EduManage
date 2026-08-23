import { db } from "@/lib/prisma";
import { emitEvent, EVENT_TYPES } from "@/lib/events";

export async function createHomework(data: {
  organizationId: string;
  subjectId?: string;
  groupId?: string;
  academicYearId?: string;
  teacherId?: string;
  title: string;
  description?: string;
  instructions?: string;
  deadline?: string;
  maxScore?: number;
  attachments?: Record<string, unknown>;
  isPublished?: boolean;
}) {
  const homework = await db.homework.create({
    data: {
      organizationId: data.organizationId,
      subjectId: data.subjectId ?? null,
      groupId: data.groupId ?? null,
      academicYearId: data.academicYearId ?? null,
      teacherId: data.teacherId ?? null,
      title: data.title,
      description: data.description ?? null,
      instructions: data.instructions ?? null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      maxScore: data.maxScore ?? null,
      isPublished: data.isPublished ?? false,
    },
    include: {
      subject: { select: { name: true } },
      group: { select: { name: true } },
    },
  });

  if (data.isPublished && data.groupId) {
    await emitEvent({
      type: EVENT_TYPES.HOMEWORK_ASSIGNED,
      organizationId: data.organizationId,
      payload: { id: homework.id, title: data.title, groupId: data.groupId },
    });
  }

  return homework;
}

export async function listHomework(organizationId: string, params?: { subjectId?: string; groupId?: string; isPublished?: boolean; page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.subjectId) where.subjectId = params.subjectId;
  if (params?.groupId) where.groupId = params.groupId;
  if (params?.isPublished !== undefined) where.isPublished = params.isPublished;

  const [homeworks, total] = await Promise.all([
    db.homework.findMany({
      where,
      include: {
        subject: { select: { name: true } },
        group: { select: { name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.homework.count({ where }),
  ]);

  return { homeworks, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getHomework(id: string, organizationId: string) {
  return db.homework.findFirst({
    where: { id, organizationId },
    include: {
      subject: { select: { name: true } },
      group: { select: { name: true } },
      submissions: { include: { student: { include: { person: { select: { firstName: true, lastName: true } } } } } },
    },
  });
}

export async function updateHomework(id: string, organizationId: string, data: Partial<{
  title: string;
  description: string;
  instructions: string;
  deadline: string;
  maxScore: number;
  isPublished: boolean;
}>) {
  const homework = await db.homework.findFirst({ where: { id, organizationId } });
  if (!homework) throw new Error("Homework not found");

  return db.homework.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.instructions !== undefined && { instructions: data.instructions }),
      ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
      ...(data.maxScore !== undefined && { maxScore: data.maxScore }),
      ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
    },
  });
}

export async function submitHomework(data: {
  organizationId: string;
  homeworkId: string;
  studentId: string;
  attachments?: Record<string, unknown>;
}) {
  return db.homeworkSubmission.upsert({
    where: { organizationId_homeworkId_studentId: { organizationId: data.organizationId, homeworkId: data.homeworkId, studentId: data.studentId } },
    create: {
      organizationId: data.organizationId,
      homeworkId: data.homeworkId,
      studentId: data.studentId,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
    update: {
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });
}

export async function gradeSubmission(id: string, score: number, feedback?: string) {
  return db.homeworkSubmission.update({
    where: { id },
    data: { score, feedback: feedback ?? null },
  });
}

export async function getStudentHomework(organizationId: string, studentId: string, params?: { page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const [submissions, total] = await Promise.all([
    db.homeworkSubmission.findMany({
      where: { organizationId, studentId },
      include: { homework: { include: { subject: { select: { name: true } }, group: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.homeworkSubmission.count({ where: { organizationId, studentId } }),
  ]);

  return { submissions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
