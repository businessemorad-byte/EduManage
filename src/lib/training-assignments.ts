import { db } from "@/lib/prisma";
import { emitEvent, EVENT_TYPES } from "@/lib/events";

export async function createTrainingAssignment(data: {
  organizationId: string;
  moduleId?: string;
  programId?: string;
  cohortId?: string;
  title: string;
  description?: string;
  deadline?: Date;
  maxScore?: number;
}) {
  return db.trainingAssignment.create({
    data: {
      organizationId: data.organizationId,
      moduleId: data.moduleId ?? null,
      programId: data.programId ?? null,
      cohortId: data.cohortId ?? null,
      title: data.title,
      description: data.description ?? null,
      deadline: data.deadline ?? null,
      maxScore: data.maxScore ?? null,
    },
  });
}

export async function listTrainingAssignments(organizationId: string, params?: { cohortId?: string; moduleId?: string; programId?: string; page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.cohortId) where.cohortId = params.cohortId;
  if (params?.moduleId) where.moduleId = params.moduleId;
  if (params?.programId) where.programId = params.programId;

  const [assignments, total] = await Promise.all([
    db.trainingAssignment.findMany({
      where,
      include: { submissions: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.trainingAssignment.count({ where }),
  ]);

  return { assignments, total, page, totalPages: Math.ceil(total / limit) };
}

export async function submitAssignment(assignmentId: string, studentId: string, organizationId: string) {
  const assignment = await db.trainingAssignment.findFirst({ where: { id: assignmentId, organizationId } });
  if (!assignment) throw new Error("Assignment not found");

  const submission = await db.trainingAssignmentSubmission.upsert({
    where: {
      organizationId_assignmentId_studentId: { organizationId, assignmentId, studentId },
    },
    create: {
      organizationId,
      assignmentId,
      studentId,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
    update: {
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  await emitEvent({ type: EVENT_TYPES.ASSIGNMENT_SUBMITTED, organizationId, payload: { assignmentId, studentId, submissionId: submission.id } });
  return submission;
}

export async function gradeAssignment(submissionId: string, organizationId: string, score: number, feedback?: string) {
  return db.trainingAssignmentSubmission.updateMany({
    where: { id: submissionId, organizationId },
    data: { score, feedback: feedback ?? null, status: "GRADED" },
  });
}
