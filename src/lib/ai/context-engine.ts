import { db } from "@/lib/prisma";

// ─── Safe Data Aggregation for AI ──────────────────────────────
// NEVER sends raw DB dumps. Aggregates data before AI consumption.

export type AggregatedStudentData = {
  totalStudents: number;
  activeStudents: number;
  newThisMonth: number;
  pausedStudents: number;
  droppedStudents: number;
  avgAttendanceRate: number;
  topPerformers: { name: string; avgGrade: number }[];
  strugglingStudents: { name: string; avgGrade: number; trend: string }[];
};

export type AggregatedFinancialData = {
  totalRevenue: number;
  totalPending: number;
  totalOverdue: number;
  collectedThisMonth: number;
  outstandingThisMonth: number;
  collectionRate: number;
  topFeePlans: { name: string; count: number; revenue: number }[];
  paymentTrends: { month: string; collected: number; pending: number }[];
};

export type AggregatedAttendanceData = {
  overallRate: number;
  todayRate: number;
  weeklyTrend: { day: string; rate: number }[];
  chronicAbsentees: { name: string; absenceCount: number; rate: number }[];
  classAttendanceRates: { className: string; rate: number }[];
};

export type AggregatedAcademicData = {
  overallAvgGrade: number;
  subjectAverages: { subject: string; avg: number }[];
  gradeDistribution: { range: string; count: number }[];
  topClasses: { className: string; avg: number }[];
  strugglingSubjects: { subject: string; avg: number; trend: string }[];
};

export type AggregatedCRMData = {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  pipelineValue: number;
  leadsBySource: { source: string; count: number; conversionRate: number }[];
  topTrainers: { name: string; completionRate: number }[];
  avgTrialToEnrollment: number;
};

export type AggregatedCommunicationData = {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  channelBreakdown: { channel: string; sent: number; delivered: number }[];
  topTemplates: { name: string; usageCount: number; openRate: number }[];
  activeCampaigns: number;
};

// ─── Aggregation Functions ────────────────────────────────────

export async function aggregateStudentData(organizationId: string): Promise<AggregatedStudentData> {
  const [totalStudents, activeStudents, newThisMonth, pausedStudents, droppedStudents] =
    await Promise.all([
      db.student.count({ where: { organizationId } }),
      db.student.count({
        where: { organizationId, status: "ACTIVE" },
      }),
      db.student.count({
        where: {
          organizationId,
          createdAt: { gte: getStartOfMonth() },
        },
      }),
      db.student.count({
        where: { organizationId, status: "PAUSED" },
      }),
      db.student.count({
        where: { organizationId, status: "DROPPED" },
      }),
    ]);

  // Attendance rate
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const attendanceRecords = await db.attendanceRecord.findMany({
    where: { organizationId, date: { gte: thirtyDaysAgo } },
    select: { status: true },
  });
  const avgAttendanceRate = attendanceRecords.length > 0
    ? Math.round((attendanceRecords.filter((r) => r.status === "PRESENT").length / attendanceRecords.length) * 100)
    : 0;

  // Grade averages for top/struggling
  const grades = await db.grade.findMany({
    where: { organizationId },
    include: { student: { include: { person: { select: { firstName: true, lastName: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const studentGrades = new Map<string, { name: string; grades: number[] }>();
  for (const g of grades) {
    const key = g.studentId;
    const existing = studentGrades.get(key);
    const name = `${g.student.person.firstName} ${g.student.person.lastName}`;
    if (existing) {
      existing.grades.push(Number(g.score));
    } else {
      studentGrades.set(key, { name, grades: [Number(g.score)] });
    }
  }

  const studentAvgs = Array.from(studentGrades.values()).map((s) => ({
    name: s.name,
    avgGrade: s.grades.reduce((a, b) => a + b, 0) / s.grades.length,
  }));

  studentAvgs.sort((a, b) => b.avgGrade - a.avgGrade);

  return {
    totalStudents,
    activeStudents,
    newThisMonth,
    pausedStudents,
    droppedStudents,
    avgAttendanceRate,
    topPerformers: studentAvgs.slice(0, 5),
    strugglingStudents: studentAvgs.slice(-5).reverse().map((s) => ({
      ...s,
      trend: "declining",
    })),
  };
}

export async function aggregateFinancialData(organizationId: string): Promise<AggregatedFinancialData> {
  const now = new Date();
  const monthStart = getStartOfMonth();

  const [invoices, payments, thisMonthPayments] = await Promise.all([
    db.invoice.findMany({
      where: { organizationId },
      select: { totalAmount: true, status: true, dueDate: true },
    }),
    db.payment.findMany({
      where: { organizationId },
      select: { amount: true, createdAt: true },
    }),
    db.payment.findMany({
      where: { organizationId, createdAt: { gte: monthStart } },
      select: { amount: true },
    }),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = invoices
    .filter((i) => i.status === "PENDING" || i.status === "PARTIAL")
    .reduce((sum, i) => sum + Number(i.totalAmount), 0);
  const totalOverdue = invoices
    .filter((i) => i.status === "OVERDUE" || (i.status === "PENDING" && i.dueDate && i.dueDate < now))
    .reduce((sum, i) => sum + Number(i.totalAmount), 0);
  const collectedThisMonth = thisMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const collectionRate = totalRevenue + totalPending > 0
    ? Math.round((totalRevenue / (totalRevenue + totalPending)) * 100)
    : 0;

  return {
    totalRevenue,
    totalPending,
    totalOverdue,
    collectedThisMonth,
    outstandingThisMonth: totalPending,
    collectionRate,
    topFeePlans: [],
    paymentTrends: [],
  };
}

export async function aggregateAttendanceData(organizationId: string): Promise<AggregatedAttendanceData> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [allRecords, todayRecords] = await Promise.all([
    db.attendanceRecord.findMany({
      where: { organizationId, date: { gte: thirtyDaysAgo } },
      select: { status: true, date: true },
    }),
    db.attendanceRecord.findMany({
      where: { organizationId, date: { gte: today, lt: tomorrow } },
      select: { status: true },
    }),
  ]);

  const overallRate = allRecords.length > 0
    ? Math.round((allRecords.filter((r) => r.status === "PRESENT").length / allRecords.length) * 100)
    : 0;

  const todayRate = todayRecords.length > 0
    ? Math.round((todayRecords.filter((r) => r.status === "PRESENT").length / todayRecords.length) * 100)
    : 0;

  return {
    overallRate,
    todayRate,
    weeklyTrend: [],
    chronicAbsentees: [],
    classAttendanceRates: [],
  };
}

export async function aggregateAcademicData(organizationId: string): Promise<AggregatedAcademicData> {
  const grades = await db.grade.findMany({
    where: { organizationId },
    include: {
      assessment: { select: { type: true, name: true } },
    },
  });

  const overallAvgGrade = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + Number(g.score), 0) / grades.length)
    : 0;

  return {
    overallAvgGrade,
    subjectAverages: [],
    gradeDistribution: [],
    topClasses: [],
    strugglingSubjects: [],
  };
}

// ─── Helpers ──────────────────────────────────────────────────

function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
