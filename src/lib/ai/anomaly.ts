import { db } from "@/lib/prisma";

// ─── Deterministic Anomaly Detection ─────────────────────────
// NO AI needed. Pure algorithmic detection.

export type Anomaly = {
  type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  description: string;
  entityType: string;
  entityId?: string;
  detectedAt: Date;
  metadata?: Record<string, unknown>;
};

// ─── Attendance Anomalies ─────────────────────────────────────

export async function detectAttendanceAnomalies(organizationId: string): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Chronic absentees: >30% absence in last 30 days
  const students = await db.student.findMany({
    where: { organizationId, status: "ACTIVE" },
    include: {
      person: { select: { firstName: true, lastName: true } },
      attendanceRecords: {
        where: { date: { gte: thirtyDaysAgo } },
        select: { status: true },
      },
    },
  });

  for (const student of students) {
    if (student.attendanceRecords.length < 5) continue;
    const absentCount = student.attendanceRecords.filter((r) => r.status === "ABSENT").length;
    const absenceRate = (absentCount / student.attendanceRecords.length) * 100;

    if (absenceRate >= 50) {
      anomalies.push({
        type: "CHRONIC_ABSENTEE",
        severity: "CRITICAL",
        title: `${student.person.firstName} ${student.person.lastName} has ${Math.round(absenceRate)}% absence rate`,
        description: `${student.person.firstName} has been absent ${absentCount} out of ${student.attendanceRecords.length} days in the last 30 days.`,
        entityType: "Student",
        entityId: student.id,
        detectedAt: new Date(),
        metadata: { absenceRate, absentCount, totalDays: student.attendanceRecords.length },
      });
    } else if (absenceRate >= 30) {
      anomalies.push({
        type: "FREQUENT_ABSENTEE",
        severity: "WARNING",
        title: `${student.person.firstName} ${student.person.lastName} has ${Math.round(absenceRate)}% absence rate`,
        description: `${student.person.firstName} has been absent ${absentCount} out of ${student.attendanceRecords.length} days in the last 30 days.`,
        entityType: "Student",
        entityId: student.id,
        detectedAt: new Date(),
        metadata: { absenceRate, absentCount, totalDays: student.attendanceRecords.length },
      });
    }
  }

  return anomalies;
}

// ─── Financial Anomalies ──────────────────────────────────────

export async function detectFinancialAnomalies(organizationId: string): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  const now = new Date();

  // Overdue payments
  const overdueInvoices = await db.invoice.findMany({
    where: {
      organizationId,
      status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
      dueDate: { lt: now },
    },
    include: {
      student: {
        include: { person: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  if (overdueInvoices.length > 0) {
    const totalOverdue = overdueInvoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);
    anomalies.push({
      type: "OVERDUE_PAYMENTS",
      severity: overdueInvoices.length > 10 ? "CRITICAL" : "WARNING",
      title: `${overdueInvoices.length} overdue invoices totaling ${totalOverdue.toLocaleString()}`,
      description: `${overdueInvoices.length} invoices are past their due date.`,
      entityType: "Invoice",
      detectedAt: now,
      metadata: { count: overdueInvoices.length, totalAmount: totalOverdue },
    });
  }

  return anomalies;
}

// ─── Academic Anomalies ───────────────────────────────────────

export async function detectAcademicAnomalies(organizationId: string): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];

  // Students with failing grades (< 50)
  const failingGrades = await db.grade.findMany({
    where: { organizationId, score: { lt: 50 } },
    include: {
      student: {
        include: { person: { select: { firstName: true, lastName: true } } },
      },
      assessment: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Deduplicate by student
  const failingStudents = new Map<string, { name: string; count: number; latest: string }>();
  for (const g of failingGrades) {
    const key = g.studentId;
    const existing = failingStudents.get(key);
    const name = `${g.student.person.firstName} ${g.student.person.lastName}`;
    if (existing) {
      existing.count++;
    } else {
      failingStudents.set(key, { name, count: 1, latest: g.assessment.name });
    }
  }

  for (const [studentId, data] of failingStudents) {
    if (data.count >= 3) {
      anomalies.push({
        type: "FREQUENT_FAILING_GRADES",
        severity: "CRITICAL",
        title: `${data.name} has ${data.count} failing grades`,
        description: `${data.name} has received failing grades in ${data.count} assessments.`,
        entityType: "Student",
        entityId: studentId,
        detectedAt: new Date(),
        metadata: { failingCount: data.count },
      });
    }
  }

  return anomalies;
}

// ─── Enrollment Anomalies ─────────────────────────────────────

export async function detectEnrollmentAnomalies(organizationId: string): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Sudden drop in enrollments
  const thisMonthEnrollments = await db.enrollment.count({
    where: { organizationId, createdAt: { gte: thirtyDaysAgo } },
  });

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthEnrollments = await db.enrollment.count({
    where: { organizationId, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
  });

  if (lastMonthEnrollments > 0 && thisMonthEnrollments < lastMonthEnrollments * 0.5) {
    anomalies.push({
      type: "ENROLLMENT_DROP",
      severity: "WARNING",
      title: `Enrollment dropped by ${Math.round(((lastMonthEnrollments - thisMonthEnrollments) / lastMonthEnrollments) * 100)}%`,
      description: `This month: ${thisMonthEnrollments} vs last month: ${lastMonthEnrollments}.`,
      entityType: "Enrollment",
      detectedAt: now,
      metadata: { thisMonth: thisMonthEnrollments, lastMonth: lastMonthEnrollments },
    });
  }

  return anomalies;
}

// ─── Combined Detection ───────────────────────────────────────

export async function detectAllAnomalies(organizationId: string): Promise<Anomaly[]> {
  const [attendance, financial, academic, enrollment] = await Promise.all([
    detectAttendanceAnomalies(organizationId),
    detectFinancialAnomalies(organizationId),
    detectAcademicAnomalies(organizationId),
    detectEnrollmentAnomalies(organizationId),
  ]);

  return [...attendance, ...financial, ...academic, ...enrollment].sort((a, b) => {
    const severityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
