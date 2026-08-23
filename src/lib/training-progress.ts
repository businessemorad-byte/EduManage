import { db } from "@/lib/prisma";

export async function getLearnerProgress(organizationId: string, studentId: string) {
  const enrollments = await db.enrollment.findMany({
    where: { organizationId, studentId, status: "ACTIVE" },
    include: {
      program: { select: { id: true, name: true, modules: true } },
      group: { select: { id: true, name: true, cohortStatus: true } },
    },
  });

  const attendanceRecords = await db.attendanceRecord.findMany({
    where: { organizationId, studentId },
    select: { status: true, date: true },
  });

  const grades = await db.grade.findMany({
    where: { organizationId, studentId },
    include: { assessment: { select: { name: true, maxScore: true, type: true } } },
  });

  const certificates = await db.certificate.findMany({
    where: { organizationId, studentId, status: "ISSUED" },
    include: { program: { select: { name: true } } },
  });

  const competencyRecords = await db.competencyRecord.findMany({
    where: { organizationId, studentId },
    include: { competency: { select: { name: true } } },
  });

  const totalSessions = attendanceRecords.length;
  const attendedSessions = attendanceRecords.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

  const avgScore = grades.length > 0
    ? grades.reduce((sum, g) => sum + (g.score / (g.assessment?.maxScore || 100)) * 100, 0) / grades.length
    : 0;

  const competenciesAchieved = competencyRecords.filter((c) => c.status === "ACHIEVED" || c.status === "MASTERED").length;
  const totalCompetencies = competencyRecords.length;

  return {
    enrollments,
    attendance: { total: totalSessions, attended: attendedSessions, rate: Math.round(attendanceRate * 10) / 10 },
    averageScore: Math.round(avgScore * 10) / 10,
    certificates,
    competencies: { total: totalCompetencies, achieved: competenciesAchieved },
    grades,
  };
}

export async function checkProgramCompletion(organizationId: string, studentId: string, programId: string) {
  const program = await db.program.findFirst({ where: { id: programId, organizationId } });
  if (!program) throw new Error("Program not found");

  const modules = await db.module.findMany({ where: { programId, organizationId } });
  const competencies = await db.competency.findMany({ where: { programId, organizationId } });

  const studentCompetencies = await db.competencyRecord.findMany({
    where: { organizationId, studentId, competency: { programId } },
  });

  const allAchieved = competencies.every((comp) =>
    studentCompetencies.some((rec) => rec.competencyId === comp.id && (rec.status === "ACHIEVED" || rec.status === "MASTERED"))
  );

  const attendanceRecords = await db.attendanceRecord.findMany({
    where: { organizationId, studentId },
  });
  const totalSessions = attendanceRecords.length;
  const attendedSessions = attendanceRecords.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

  const grades = await db.grade.findMany({
    where: { organizationId, studentId },
  });
  const avgScore = grades.length > 0
    ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length
    : 0;

  const eligible = allAchieved && (competencies.length > 0 ? true : true) && attendanceRate >= 75;

  return {
    eligible,
    competenciesRequired: competencies.length,
    competenciesAchieved: studentCompetencies.filter((c) => c.status === "ACHIEVED" || c.status === "MASTERED").length,
    attendanceRate: Math.round(attendanceRate * 10) / 10,
    averageScore: Math.round(avgScore * 10) / 10,
    allCompetenciesMet: allAchieved,
  };
}
