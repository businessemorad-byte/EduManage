import { db } from "@/lib/prisma";
import { emitEvent, EVENT_TYPES } from "@/lib/events";

export async function enrollTrainee(data: {
  organizationId: string;
  studentId: string;
  programId: string;
  cohortId?: string;
  feePlanId?: string;
  monthlyFee?: number;
}) {
  const program = await db.program.findFirst({ where: { id: data.programId, organizationId: data.organizationId } });
  if (!program) throw new Error("Program not found");
  if (!program.isActive) throw new Error("Program is not active");

  if (data.cohortId) {
    const cohort = await db.group.findFirst({ where: { id: data.cohortId, organizationId: data.organizationId } });
    if (!cohort) throw new Error("Cohort not found");
    if (cohort.cohortStatus === "ARCHIVED" || cohort.cohortStatus === "CANCELED") {
      throw new Error("Cannot enroll in an archived or canceled cohort");
    }
    if (cohort.programId !== data.programId) {
      throw new Error("Cohort does not belong to the selected program");
    }
    if (cohort.capacity) {
      const enrolled = await db.enrollment.count({ where: { groupId: data.cohortId, status: "ACTIVE" } });
      if (enrolled >= cohort.capacity) {
        throw new Error("Cohort is at full capacity");
      }
    }
  }

  const existing = await db.enrollment.findFirst({
    where: {
      studentId: data.studentId,
      programId: data.programId,
      organizationId: data.organizationId,
      status: "ACTIVE",
    },
  });
  if (existing) {
    throw new Error("Trainee is already actively enrolled in this program");
  }

  const student = await db.student.findFirst({ where: { id: data.studentId, organizationId: data.organizationId } });
  if (!student) throw new Error("Student not found in this organization");

  const enrollment = await db.enrollment.create({
    data: {
      organizationId: data.organizationId,
      studentId: data.studentId,
      programId: data.programId,
      groupId: data.cohortId ?? null,
      feePlanId: data.feePlanId ?? null,
      monthlyFee: data.monthlyFee ?? null,
      status: "ACTIVE",
    },
    include: {
      student: { include: { person: { select: { firstName: true, lastName: true } } } },
      program: { select: { name: true, price: true } },
      group: { select: { name: true } },
    },
  });

  if (data.cohortId) {
    await emitEvent({
      type: EVENT_TYPES.COHORT_ENROLLMENT,
      organizationId: data.organizationId,
      payload: { cohortId: data.cohortId, studentId: data.studentId, enrollmentId: enrollment.id },
    });
  }

  await emitEvent({
    type: "ENROLLMENT_CREATED" as typeof EVENT_TYPES[keyof typeof EVENT_TYPES],
    organizationId: data.organizationId,
    payload: { enrollmentId: enrollment.id, studentId: data.studentId, programId: data.programId },
  });

  return enrollment;
}

export async function withdrawTrainee(enrollmentId: string, organizationId: string, reason?: string) {
  const enrollment = await db.enrollment.findFirst({ where: { id: enrollmentId, organizationId } });
  if (!enrollment) throw new Error("Enrollment not found");
  if (enrollment.status !== "ACTIVE") throw new Error("Only active enrollments can be withdrawn");

  return db.enrollment.update({
    where: { id: enrollmentId },
    data: { status: "WITHDRAWN", endDate: new Date() },
  });
}

export async function listTrainingEnrollments(organizationId: string, params?: {
  programId?: string;
  cohortId?: string;
  studentId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.programId) where.programId = params.programId;
  if (params?.cohortId) where.groupId = params.cohortId;
  if (params?.studentId) where.studentId = params.studentId;
  if (params?.status) where.status = params.status;
  if (params?.search) {
    where.OR = [
      { student: { person: { firstName: { contains: params.search, mode: "insensitive" } } } },
      { student: { person: { lastName: { contains: params.search, mode: "insensitive" } } } },
      { program: { name: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  const [enrollments, total] = await Promise.all([
    db.enrollment.findMany({
      where,
      include: {
        student: { include: { person: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        program: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.enrollment.count({ where }),
  ]);

  return { enrollments, total, page, totalPages: Math.ceil(total / limit) };
}

export async function checkCertificateEligibility(organizationId: string, studentId: string, programId: string) {
  const program = await db.program.findFirst({ where: { id: programId, organizationId } });
  if (!program) throw new Error("Program not found");

  const enrollment = await db.enrollment.findFirst({
    where: { studentId, programId, organizationId, status: "ACTIVE" },
  });
  if (!enrollment) throw new Error("No active enrollment found for this student in this program");

  const existingCert = await db.certificate.findFirst({
    where: { studentId, programId, organizationId, status: "ISSUED" },
  });
  if (existingCert) {
    return {
      eligible: false,
      reason: "Certificate already issued",
      certificateId: existingCert.id,
      certificateNumber: existingCert.certificateNumber,
    };
  }

  const competencies = await db.competency.findMany({ where: { programId, organizationId } });
  const studentCompetencies = await db.competencyRecord.findMany({
    where: { organizationId, studentId, competency: { programId } },
  });

  const competenciesAchieved = competencies.filter((comp) =>
    studentCompetencies.some((rec) => rec.competencyId === comp.id && (rec.status === "ACHIEVED" || rec.status === "MASTERED"))
  ).length;
  const allCompetenciesMet = competencies.length === 0 || competenciesAchieved >= competencies.length;

  const attendanceRecords = await db.attendanceRecord.findMany({
    where: { organizationId, studentId },
  });
  const totalSessions = attendanceRecords.length;
  const attendedSessions = attendanceRecords.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
  const attendanceMet = attendanceRate >= 75;

  const modules = await db.module.findMany({ where: { programId, organizationId } });

  return {
    eligible: allCompetenciesMet && attendanceMet,
    programName: program.name,
    competenciesRequired: competencies.length,
    competenciesAchieved,
    allCompetenciesMet,
    attendanceRate: Math.round(attendanceRate * 10) / 10,
    attendanceMet,
    attendanceRequired: 75,
    totalModules: modules.length,
    conditions: [
      { name: "Competencies", met: allCompetenciesMet, detail: `${competenciesAchieved}/${competencies.length} achieved` },
      { name: "Attendance", met: attendanceMet, detail: `${Math.round(attendanceRate * 10) / 10}% (min 75%)` },
    ],
  };
}
