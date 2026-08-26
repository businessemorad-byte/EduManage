import { db } from "@/lib/prisma";

// ─── Assessment CRUD ─────────────────────────────────────────────

export async function createAssessment(data: {
  organizationId: string;
  subjectId?: string;
  moduleId?: string;
  groupId?: string;
  academicYearId?: string;
  name: string;
  description?: string;
  type?: string;
  term?: string;
  maxScore?: number;
  weight?: number;
  date?: string;
}) {
  return db.assessment.create({
    data: {
      organizationId: data.organizationId,
      subjectId: data.subjectId ?? null,
      moduleId: data.moduleId ?? null,
      groupId: data.groupId ?? null,
      academicYearId: data.academicYearId ?? null,
      name: data.name,
      description: data.description ?? null,
      type: data.type ?? "EXAM",
      term: data.term ?? null,
      maxScore: Math.max(data.maxScore ?? 100, 1),
      weight: data.weight ?? null,
      date: data.date ? new Date(data.date) : null,
    },
  });
}

export async function listAssessments(organizationId: string, params?: { subjectId?: string; moduleId?: string; groupId?: string; academicYearId?: string; term?: string; type?: string }) {
  return db.assessment.findMany({
    where: {
      organizationId,
      isActive: true,
      ...(params?.subjectId ? { subjectId: params.subjectId } : {}),
      ...(params?.moduleId ? { moduleId: params.moduleId } : {}),
      ...(params?.groupId ? { groupId: params.groupId } : {}),
      ...(params?.academicYearId ? { academicYearId: params.academicYearId } : {}),
      ...(params?.term ? { term: params.term } : {}),
      ...(params?.type ? { type: params.type } : {}),
    },
    include: {
      subject: { select: { name: true } },
      module: { select: { name: true } },
      group: { select: { name: true } },
      _count: { select: { grades: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteAssessment(id: string) {
  return db.assessment.update({ where: { id }, data: { isActive: false } });
}

// ─── Grade CRUD ──────────────────────────────────────────────────

export async function recordGrade(data: {
  organizationId: string;
  studentId: string;
  assessmentId: string;
  score: number;
  comments?: string;
}) {
  if (typeof data.score !== "number" || isNaN(data.score)) {
    throw new Error("Score must be a valid number");
  }

  const assessment = await db.assessment.findFirst({
    where: { id: data.assessmentId, organizationId: data.organizationId, isActive: true },
  });
  if (!assessment) throw new Error("Assessment not found in this organization");

  if (data.score < 0) throw new Error("Score cannot be negative");
  if (assessment.maxScore && data.score > assessment.maxScore) {
    throw new Error(`Score ${data.score} exceeds maximum score of ${assessment.maxScore}`);
  }

  return db.grade.upsert({
    where: {
      organizationId_studentId_assessmentId: {
        organizationId: data.organizationId,
        studentId: data.studentId,
        assessmentId: data.assessmentId,
      },
    },
    create: {
      organizationId: data.organizationId,
      studentId: data.studentId,
      assessmentId: data.assessmentId,
      score: data.score,
      comments: data.comments ?? null,
    },
    update: {
      score: data.score,
      comments: data.comments ?? null,
    },
  });
}

export async function recordBatchGrades(
  grades: Array<{ organizationId: string; studentId: string; assessmentId: string; score: number; comments?: string }>
) {
  const results = [];
  for (const g of grades) {
    results.push(await recordGrade(g));
  }
  return results;
}

export async function getStudentGrades(params: {
  organizationId: string;
  studentId: string;
  subjectId?: string;
}) {
  return db.grade.findMany({
    where: {
      organizationId: params.organizationId,
      studentId: params.studentId,
      ...(params.subjectId ? { assessment: { subjectId: params.subjectId } } : {}),
    },
    include: {
      assessment: { select: { name: true, maxScore: true, weight: true, date: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStudentAcademicSummary(params: {
  organizationId: string;
  studentId: string;
}) {
  const grades = await db.grade.findMany({
    where: { organizationId: params.organizationId, studentId: params.studentId },
    include: { assessment: { select: { name: true, maxScore: true, weight: true, subjectId: true } } },
  });

  if (grades.length === 0) return { average: null, totalAssessments: 0, grades: [] };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const g of grades) {
    const percentage = g.score / g.assessment.maxScore;
    const weight = g.assessment.weight ?? 1;
    weightedSum += percentage * weight;
    totalWeight += weight;
  }

  const average = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : null;

  return {
    average: average !== null ? Math.round(average * 100) / 100 : null,
    totalAssessments: grades.length,
    grades,
  };
}
