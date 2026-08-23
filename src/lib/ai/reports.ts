import {
  aggregateStudentData,
  aggregateFinancialData,
  aggregateAttendanceData,
  aggregateAcademicData,
  type AggregatedStudentData,
  type AggregatedFinancialData,
  type AggregatedAttendanceData,
  type AggregatedAcademicData,
} from "@/lib/ai/context-engine";

// ─── Report Generation ────────────────────────────────────────
// Deterministic data aggregation. AI summarizes the aggregated data.

export type ReportType = "daily" | "weekly" | "monthly";

export type ReportData = {
  type: ReportType;
  generatedAt: Date;
  organizationId: string;
  students: AggregatedStudentData;
  financial: AggregatedFinancialData;
  attendance: AggregatedAttendanceData;
  academic: AggregatedAcademicData;
  summary: string;
};

export async function generateReport(organizationId: string, type: ReportType): Promise<ReportData> {
  const [students, financial, attendance, academic] = await Promise.all([
    aggregateStudentData(organizationId),
    aggregateFinancialData(organizationId),
    aggregateAttendanceData(organizationId),
    aggregateAcademicData(organizationId),
  ]);

  const summary = buildReportSummary(type, students, financial, attendance, academic);

  return {
    type,
    generatedAt: new Date(),
    organizationId,
    students,
    financial,
    attendance,
    academic,
    summary,
  };
}

function buildReportSummary(
  type: ReportType,
  students: AggregatedStudentData,
  financial: AggregatedFinancialData,
  attendance: AggregatedAttendanceData,
  academic: AggregatedAcademicData,
): string {
  const period = type === "daily" ? "today" : type === "weekly" ? "this week" : "this month";
  const lines = [
    `## ${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
    "",
    `### Students`,
    `- Total: ${students.totalStudents} (${students.activeStudents} active)`,
    `- New this ${period}: ${students.newThisMonth}`,
    `- Attendance rate: ${attendance.overallRate}%`,
    "",
    `### Financials`,
    `- Revenue: ${financial.totalRevenue.toLocaleString()}`,
    `- Pending: ${financial.totalPending.toLocaleString()}`,
    `- Overdue: ${financial.totalOverdue.toLocaleString()}`,
    `- Collection rate: ${financial.collectionRate}%`,
    "",
    `### Academics`,
    `- Overall average grade: ${academic.overallAvgGrade}%`,
    "",
    `### Key Insights`,
    `- ${students.strugglingStudents.length} students struggling`,
    `- ${students.topPerformers.length} top performers identified`,
  ];

  return lines.join("\n");
}

// ─── Insight Storage ──────────────────────────────────────────

import { db } from "@/lib/prisma";

export async function saveInsight(data: {
  organizationId: string;
  category: string;
  title: string;
  summary: string;
  severity?: string;
  details?: Record<string, unknown>;
}) {
  return db.aIInsight.create({
    data: {
      organizationId: data.organizationId,
      category: data.category,
      title: data.title,
      summary: data.summary,
      severity: data.severity ?? "INFO",
      details: data.details as never,
    },
  });
}

export async function listInsights(organizationId: string, filters?: { category?: string; severity?: string; unreadOnly?: boolean }) {
  return db.aIInsight.findMany({
    where: {
      organizationId,
      ...(filters?.category ? { category: filters.category } : {}),
      ...(filters?.severity ? { severity: filters.severity } : {}),
      ...(filters?.unreadOnly ? { isRead: false } : {}),
    },
    orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
  });
}

export async function markInsightRead(organizationId: string, id: string) {
  return db.aIInsight.updateMany({
    where: { id, organizationId },
    data: { isRead: true },
  });
}

export async function getInsightStats(organizationId: string) {
  const [total, unread, byCategory, bySeverity] = await Promise.all([
    db.aIInsight.count({ where: { organizationId } }),
    db.aIInsight.count({ where: { organizationId, isRead: false } }),
    db.aIInsight.groupBy({
      by: ["category"],
      where: { organizationId },
      _count: true,
    }),
    db.aIInsight.groupBy({
      by: ["severity"],
      where: { organizationId },
      _count: true,
    }),
  ]);

  return { total, unread, byCategory, bySeverity };
}
