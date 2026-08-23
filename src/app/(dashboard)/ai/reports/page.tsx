"use client";

import { useState } from "react";

type Report = {
  type: string;
  generatedAt: string;
  summary: string;
  students: { totalStudents: number; activeStudents: number; avgAttendanceRate: number };
  financial: { totalRevenue: number; collectionRate: number };
  academic: { overallAvgGrade: number };
};

export default function AIReportsPage() {
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/reports/${reportType}`);
      const data = await res.json();
      setReport(data);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">AI Reports</h1>

      <div className="flex items-center gap-3">
        <select value={reportType} onChange={(e) => setReportType(e.target.value as "daily" | "weekly" | "monthly")} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <button onClick={generate} disabled={loading} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {report && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs font-medium text-zinc-500">Students</p>
              <p className="mt-1 text-2xl font-bold">{report.students.activeStudents}</p>
              <p className="text-xs text-zinc-500">{report.students.avgAttendanceRate}% attendance</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs font-medium text-zinc-500">Revenue</p>
              <p className="mt-1 text-2xl font-bold">{report.financial.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-zinc-500">{report.financial.collectionRate}% collection</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs font-medium text-zinc-500">Avg Grade</p>
              <p className="mt-1 text-2xl font-bold">{report.academic.overallAvgGrade}%</p>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-3 font-semibold">Report Summary</h2>
            <pre className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{report.summary}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
