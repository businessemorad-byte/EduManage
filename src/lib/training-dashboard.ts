import { db } from "@/lib/prisma";

export async function getTrainingDashboard(organizationId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalLearners,
    activeLearners,
    totalPrograms,
    activePrograms,
    totalCohorts,
    activeCohorts,
    totalTrainers,
    totalCertificates,
    pendingCertificates,
    pendingLeads,
    corporateClients,
    activeContracts,
    monthlyRevenue,
  ] = await Promise.all([
    db.enrollment.count({ where: { organizationId, status: "ACTIVE" } }),
    db.student.count({ where: { organizationId, status: "ACTIVE" } }),
    db.program.count({ where: { organizationId, isActive: true } }),
    db.program.count({ where: { organizationId, isActive: true, programStatus: "ACTIVE" } }),
    db.group.count({ where: { organizationId, isActive: true } }),
    db.group.count({ where: { organizationId, cohortStatus: "ACTIVE" } }),
    db.trainer.count({ where: { organizationId, status: "ACTIVE" } }),
    db.certificate.count({ where: { organizationId, status: "ISSUED" } }),
    db.certificate.count({ where: { organizationId, status: "PENDING" } }),
    db.lead.count({ where: { organizationId, status: { in: ["LEAD", "CONTACTED", "INTERESTED"] } } }),
    db.corporateClient.count({ where: { organizationId, status: "ACTIVE" } }),
    db.corporateContract.count({ where: { organizationId, status: "ACTIVE" } }),
    db.payment.aggregate({
      where: { organizationId, status: "COMPLETED", createdAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
  ]);

  const upcomingSessions = await db.classSession.findMany({
    where: {
      organizationId,
      isActive: true,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    include: {
      group: { select: { name: true } },
      teacher: { include: { staff: { include: { person: true } } } },
      room: { select: { name: true } },
    },
    take: 10,
    orderBy: { startTime: "asc" },
  });

  const recentEnrollments = await db.enrollment.findMany({
    where: { organizationId, createdAt: { gte: monthStart } },
    include: {
      student: { include: { person: true } },
      program: { select: { name: true } },
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const outstandingBalance = await db.invoice.aggregate({
    where: { organizationId, status: { in: ["PENDING", "OVERDUE", "PARTIAL"] } },
    _sum: { totalAmount: true, paidAmount: true },
  });

  const outstanding = Number(outstandingBalance._sum.totalAmount ?? 0) - Number(outstandingBalance._sum.paidAmount ?? 0);

  return {
    totalLearners,
    activeLearners,
    totalPrograms,
    activePrograms,
    totalCohorts,
    activeCohorts,
    totalTrainers,
    totalCertificates,
    pendingCertificates,
    pendingLeads,
    corporateClients,
    activeContracts,
    monthlyRevenue: Number(monthlyRevenue._sum.amount ?? 0),
    outstandingBalance: outstanding,
    upcomingSessions,
    recentEnrollments,
  };
}

export async function getProgramProfitability(organizationId: string, programId: string, month: number, year: number) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  const program = await db.program.findFirst({ where: { id: programId, organizationId } });
  if (!program) throw new Error("Program not found");

  const enrollments = await db.enrollment.findMany({
    where: { programId, organizationId, createdAt: { gte: monthStart, lte: monthEnd } },
  });

  const programStudents = await db.enrollment.findMany({
    where: { programId, organizationId },
    select: { studentId: true },
  });
  const studentIds = programStudents.map((e) => e.studentId);

  const revenue = await db.payment.aggregate({
    where: {
      organizationId,
      invoice: { studentId: { in: studentIds } },
      status: "COMPLETED",
      createdAt: { gte: monthStart, lte: monthEnd },
    },
    _sum: { amount: true },
  });

  const sessions = await db.classSession.findMany({
    where: {
      organizationId,
      group: { programId },
      startDate: { gte: monthStart, lte: monthEnd },
    },
    include: { teacher: true },
  });

  let trainerCost = 0;
  for (const session of sessions) {
    if (session.teacher?.hourlyRate) {
      const startParts = session.startTime.split(":").map(Number);
      const endParts = session.endTime.split(":").map(Number);
      const hours = ((endParts[0] * 60 + endParts[1]) - (startParts[0] * 60 + startParts[1])) / 60;
      trainerCost += hours * Number(session.teacher.hourlyRate);
    }
  }

  const revenueAmount = Number(revenue._sum?.amount ?? 0);
  const margin = revenueAmount - trainerCost;

  return {
    programId,
    programName: program.name,
    month,
    year,
    enrollments: enrollments.length,
    revenue: revenueAmount,
    trainerCost,
    estimatedMargin: margin,
    marginPercent: revenueAmount > 0 ? Math.round((margin / revenueAmount) * 100) : 0,
  };
}

export async function getCohortProfitability(organizationId: string, cohortId: string) {
  const cohort = await db.group.findFirst({
    where: { id: cohortId, organizationId },
    include: { program: { select: { name: true } } },
  });
  if (!cohort) throw new Error("Cohort not found");

  const enrollments = await db.enrollment.count({ where: { groupId: cohortId, status: "ACTIVE" } });

  const cohortStudents = await db.enrollment.findMany({
    where: { groupId: cohortId },
    select: { studentId: true },
  });
  const studentIds = cohortStudents.map((e) => e.studentId);

  const revenue = await db.payment.aggregate({
    where: {
      organizationId,
      invoice: { studentId: { in: studentIds } },
      status: "COMPLETED",
    },
    _sum: { amount: true },
  });

  const sessions = await db.classSession.findMany({
    where: { organizationId, groupId: cohortId },
    include: { teacher: true },
  });

  let trainerCost = 0;
  for (const session of sessions) {
    if (session.teacher?.hourlyRate) {
      const startParts = session.startTime.split(":").map(Number);
      const endParts = session.endTime.split(":").map(Number);
      const hours = ((endParts[0] * 60 + endParts[1]) - (startParts[0] * 60 + startParts[1])) / 60;
      trainerCost += hours * Number(session.teacher.hourlyRate);
    }
  }

  const revenueAmount = Number(revenue._sum?.amount ?? 0);

  return {
    cohortId,
    cohortName: cohort.name,
    programName: cohort.program?.name ?? null,
    activeEnrollments: enrollments,
    revenue: revenueAmount,
    trainerCost,
    estimatedMargin: revenueAmount - trainerCost,
  };
}
