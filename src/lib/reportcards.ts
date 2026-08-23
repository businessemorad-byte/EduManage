import { db } from "@/lib/prisma";
import { emitEvent, EVENT_TYPES } from "@/lib/events";

export async function getGradingConfig(organizationId: string) {
  let config = await db.gradingConfig.findUnique({ where: { organizationId } });
  if (!config) {
    config = await db.gradingConfig.create({
      data: { organizationId },
    });
  }
  return config;
}

export async function updateGradingConfig(organizationId: string, data: Partial<{
  minScore: number;
  maxScore: number;
  passingScore: number;
  roundingRule: string;
  enableRanking: boolean;
  enablePromotion: boolean;
}>) {
  await getGradingConfig(organizationId);
  return db.gradingConfig.update({
    where: { organizationId },
    data,
  });
}

function roundScore(score: number, rule: string, maxScore: number): number {
  const normalized = (score / maxScore) * 20;
  switch (rule) {
    case "CEIL": return Math.ceil(normalized * 100) / 100;
    case "FLOOR": return Math.floor(normalized * 100) / 100;
    case "NONE": return Math.round(normalized * 100) / 100;
    case "ROUND":
    default: return Math.round(normalized * 100) / 100;
  }
}

export async function calculateSubjectAverages(params: {
  organizationId: string;
  studentId: string;
  academicYearId?: string;
  groupId?: string;
}) {
  const grades = await db.grade.findMany({
    where: {
      organizationId: params.organizationId,
      studentId: params.studentId,
      ...(params.academicYearId ? { assessment: { academicYearId: params.academicYearId } } : {}),
      ...(params.groupId ? { assessment: { groupId: params.groupId } } : {}),
    },
    include: {
      assessment: { select: { name: true, maxScore: true, weight: true, subjectId: true, subject: { select: { name: true } } } },
    },
  });

  const config = await getGradingConfig(params.organizationId);
  const subjectMap = new Map<string, { name: string; grades: { score: number; maxScore: number; weight: number }[]; weightedSum: number; totalWeight: number }>();

  for (const g of grades) {
    const subjectId = g.assessment.subjectId ?? "unknown";
    const subjectName = g.assessment.subject?.name ?? g.assessment.name;
    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, { name: subjectName, grades: [], weightedSum: 0, totalWeight: 0 });
    }
    const entry = subjectMap.get(subjectId)!;
    const weight = g.assessment.weight ?? 1;
    const normalizedScore = (g.score / g.assessment.maxScore) * config.maxScore;
    entry.grades.push({ score: normalizedScore, maxScore: config.maxScore, weight });
    entry.weightedSum += normalizedScore * weight;
    entry.totalWeight += weight;
  }

  return Array.from(subjectMap.entries()).map(([subjectId, data]) => ({
    subjectId,
    subjectName: data.name,
    average: data.totalWeight > 0 ? roundScore(data.weightedSum / data.totalWeight, config.roundingRule, config.maxScore) : null,
    grades: data.grades,
    coefficient: data.totalWeight,
  }));
}

export async function calculateOverallAverage(subjectAverages: Array<{ average: number | null; coefficient: number }>) {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const s of subjectAverages) {
    if (s.average !== null) {
      weightedSum += s.average * s.coefficient;
      totalWeight += s.coefficient;
    }
  }
  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : null;
}

export async function generateReportCard(data: {
  organizationId: string;
  studentId: string;
  academicYearId?: string;
  groupId?: string;
  term?: string;
  teacherRemarks?: string;
  adminRemarks?: string;
}) {
  const subjectAverages = await calculateSubjectAverages(data);
  const overallAverage = await calculateOverallAverage(subjectAverages);

  const config = await getGradingConfig(data.organizationId);
  const passingScore = (config.passingScore / config.maxScore) * 20;

  const reportCard = await db.reportCard.upsert({
    where: {
      organizationId_studentId_academicYearId_groupId_term: {
        organizationId: data.organizationId,
        studentId: data.studentId,
        academicYearId: data.academicYearId ?? "",
        groupId: data.groupId ?? "",
        term: data.term ?? "",
      },
    },
    create: {
      organizationId: data.organizationId,
      studentId: data.studentId,
      academicYearId: data.academicYearId ?? null,
      groupId: data.groupId ?? null,
      term: data.term ?? null,
      overallAverage,
      teacherRemarks: data.teacherRemarks ?? null,
      adminRemarks: data.adminRemarks ?? null,
      items: {
        create: subjectAverages.map((s) => ({
          subjectId: s.subjectId === "unknown" ? null : s.subjectId,
          subjectName: s.subjectName,
          average: s.average ?? 0,
          coefficient: s.coefficient,
          grade1: s.grades[0]?.score ?? null,
          grade2: s.grades[1]?.score ?? null,
          grade3: s.grades[2]?.score ?? null,
        })),
      },
    },
    update: {
      overallAverage,
      teacherRemarks: data.teacherRemarks ?? undefined,
      adminRemarks: data.adminRemarks ?? undefined,
      items: {
        deleteMany: {},
        create: subjectAverages.map((s) => ({
          subjectId: s.subjectId === "unknown" ? null : s.subjectId,
          subjectName: s.subjectName,
          average: s.average ?? 0,
          coefficient: s.coefficient,
          grade1: s.grades[0]?.score ?? null,
          grade2: s.grades[1]?.score ?? null,
          grade3: s.grades[2]?.score ?? null,
        })),
      },
    },
    include: { items: true },
  });

  return { reportCard, promotionStatus: overallAverage !== null && overallAverage >= passingScore ? "PROMOTED" : "REPEAT" };
}

export async function finalizeReportCard(id: string, organizationId: string, finalizedBy: string) {
  const reportCard = await db.reportCard.findFirst({ where: { id, organizationId } });
  if (!reportCard) throw new Error("Report card not found");
  if (reportCard.status === "FINALIZED") throw new Error("Report card already finalized");

  const updated = await db.reportCard.update({
    where: { id },
    data: { status: "FINALIZED", finalizedAt: new Date(), finalizedBy },
    include: { items: true },
  });

  await emitEvent({
    type: EVENT_TYPES.REPORT_CARD_FINALIZED,
    organizationId,
    payload: { id: updated.id, studentId: updated.studentId, term: updated.term },
  });

  return updated;
}

export async function listReportCards(organizationId: string, params?: { studentId?: string; academicYearId?: string; groupId?: string; term?: string; status?: string; page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.studentId) where.studentId = params.studentId;
  if (params?.academicYearId) where.academicYearId = params.academicYearId;
  if (params?.groupId) where.groupId = params.groupId;
  if (params?.term) where.term = params.term;
  if (params?.status) where.status = params.status;

  const [reportCards, total] = await Promise.all([
    db.reportCard.findMany({
      where,
      include: {
        student: { include: { person: { select: { firstName: true, lastName: true } } } },
        group: { select: { name: true } },
        academicYear: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.reportCard.count({ where }),
  ]);

  return { reportCards, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function promoteStudent(data: {
  organizationId: string;
  studentId: string;
  fromAcademicYearId?: string;
  toAcademicYearId?: string;
  fromGroupId?: string;
  toGroupId?: string;
  status: "PROMOTED" | "REPEAT" | "CONDITIONAL" | "PENDING";
  reason?: string;
}) {
  const promotion = await db.promotion.create({
    data: {
      organizationId: data.organizationId,
      studentId: data.studentId,
      fromAcademicYearId: data.fromAcademicYearId ?? null,
      toAcademicYearId: data.toAcademicYearId ?? null,
      fromGroupId: data.fromGroupId ?? null,
      toGroupId: data.toGroupId ?? null,
      status: data.status,
      reason: data.reason ?? null,
    },
  });

  await emitEvent({
    type: EVENT_TYPES.STUDENT_PROMOTED,
    organizationId: data.organizationId,
    payload: { id: promotion.id, studentId: data.studentId, status: data.status },
  });

  return promotion;
}

export async function listPromotions(organizationId: string, params?: { studentId?: string; status?: string; fromAcademicYearId?: string; page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.studentId) where.studentId = params.studentId;
  if (params?.status) where.status = params.status;
  if (params?.fromAcademicYearId) where.fromAcademicYearId = params.fromAcademicYearId;

  const [promotions, total] = await Promise.all([
    db.promotion.findMany({
      where,
      include: {
        student: { include: { person: { select: { firstName: true, lastName: true } } } },
        fromAcademicYear: { select: { name: true } },
        toAcademicYear: { select: { name: true } },
        fromGroup: { select: { name: true } },
        toGroup: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.promotion.count({ where }),
  ]);

  return { promotions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
