"use server";

import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/rbac";

function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const escape = (v: string | number | null) => {
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? '"' + s.replace(/"/g, '""') + '"'
      : s;
  };
  return [headers.map(escape).join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
}

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, PERMISSIONS.REPORTS_READ);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sp = new URL(request.url).searchParams;
    const reportType = sp.get("type") || "overview";

    const range = { startDate: sp.get("startDate") ?? undefined, endDate: sp.get("endDate") ?? undefined };

    let csv = "";
    let filename = "report.csv";

    if (reportType === "people") {
      const { getPeopleReport } = await import("@/lib/reports");
      const data = await getPeopleReport(organizationId, range);
      const headers = ["Metric", "Value"];
      const rows: (string | number)[][] = [
        ["Total Students", data.totalStudents],
        ["Active Students", data.activeStudents],
        ["Inactive Students", data.inactiveStudents],
        ["New Registrations", data.newRegistrations],
      ];
      for (const g of data.byGroup) rows.push(["Group: " + g.name, g.count]);
      for (const [level, count] of Object.entries(data.byLevel)) rows.push(["Level: " + level, count]);
      for (const s of data.staffByType) rows.push(["Staff: " + s.type, s.count]);
      csv = toCsv(headers, rows);
      filename = "people-report.csv";
    } else if (reportType === "academic") {
      const { getAcademicReport } = await import("@/lib/reports");
      const data = await getAcademicReport(organizationId, range);
      const headers = ["Subject/Group", "Average Score (%)", "Assessment Count"];
      const rows: (string | number)[][] = data.bySubject.map(s => [s.name, s.average, s.count]);
      for (const g of data.byGroup) rows.push([g.name + " (group)", g.average, g.count]);
      csv = toCsv(headers, rows);
      filename = "academic-report.csv";
    } else if (reportType === "attendance") {
      const { getAttendanceReport } = await import("@/lib/reports");
      const data = await getAttendanceReport(organizationId, range);
      const headers = ["Group", "Attendance Rate (%)", "Total Records"];
      const rows = data.byGroup.map(g => [g.name, g.rate, g.total]);
      csv = toCsv(headers, rows);
      filename = "attendance-report.csv";
    } else if (reportType === "finance") {
      const { getFinanceReport } = await import("@/lib/reports");
      const data = await getFinanceReport(organizationId, range);
      const headers = ["Month", "Invoiced", "Paid"];
      const rows = data.byMonth.map(m => [m.month, m.invoiced, m.paid]);
      csv = toCsv(headers, rows);
      filename = "finance-report.csv";
    } else if (reportType === "admissions") {
      const { getAdmissionsReport } = await import("@/lib/reports");
      const data = await getAdmissionsReport(organizationId, range);
      const headers = ["Status", "Count"];
      const rows = [...data.leadsByStatus.map(l => ["Lead: " + l.status, l.count]), ...data.admissionsByStatus.map(a => ["Admission: " + a.status, a.count])];
      csv = toCsv(headers, rows);
      filename = "admissions-report.csv";
    } else if (reportType === "scheduling") {
      const { getSchedulingReport } = await import("@/lib/reports");
      const data = await getSchedulingReport(organizationId, range);
      const headers = ["Day", "Sessions"];
      const rows = data.byDay.map(d => [d.day, d.count]);
      csv = toCsv(headers, rows);
      filename = "scheduling-report.csv";
    } else {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=" + filename },
    });
  } catch (err: unknown) {
    const status = err instanceof Error && (err.message === "Not authenticated" || err.message === "No organization context") ? 401 : 500;
    return NextResponse.json({ error: "Unable to export report." }, { status });
  }
}
