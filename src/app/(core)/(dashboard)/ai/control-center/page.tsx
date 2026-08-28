"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";

type ControlCenterData = {
  overview: {
    students: { totalStudents: number; activeStudents: number; newThisMonth: number; avgAttendanceRate: number; topPerformers: { name: string; avgGrade: number }[]; strugglingStudents: { name: string; avgGrade: number }[] };
    financial: { totalRevenue: number; totalPending: number; totalOverdue: number; collectionRate: number; collectedThisMonth: number };
    attendance: { overallRate: number; todayRate: number };
    academic: { overallAvgGrade: number };
  };
  usage: { total: { _count: number; _sum: { creditsConsumed: number | null } } };
  credits: { monthly: number; used: number; extra: number };
};

export default function AIControlCenterPage() {
  const [data, setData] = useState<ControlCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [report, setReport] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetch("/api/ai/control-center")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch(`/api/ai/reports/${reportType}`);
      const r = await res.json();
      setReport(r.summary);
    } catch {
      // error
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) return <LoadingState />;
  if (!data) return <div className="text-sm text-zinc-500">Failed to load control center.</div>;

  const o = data.overview;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">AI Control Center</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500">Total Students</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{o.students.totalStudents}</p>
          <p className="text-xs text-green-600">+{o.students.newThisMonth} this month</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500">Attendance Rate</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{o.attendance.overallRate}%</p>
          <p className="text-xs text-zinc-500">Today: {o.attendance.todayRate}%</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500">Collection Rate</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{o.financial.collectionRate}%</p>
          <p className="text-xs text-zinc-500">{o.financial.collectedThisMonth.toLocaleString()} collected</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500">Avg Grade</p>
          <p className="mt-1 text-2xl font-bold text-purple-600">{o.academic.overallAvgGrade}%</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500">AI Usage</p>
          <p className="mt-1 text-2xl font-bold text-cyan-600">{data.usage.total._count} calls</p>
          <p className="text-xs text-zinc-500">{data.usage.total._sum.creditsConsumed ?? 0} credits</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-3 font-semibold">Top Performers</h2>
          {o.students.topPerformers.length === 0 ? (
            <p className="text-sm text-zinc-500">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {o.students.topPerformers.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="font-medium text-green-600">{s.avgGrade.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-3 font-semibold">Struggling Students</h2>
          {o.students.strugglingStudents.length === 0 ? (
            <p className="text-sm text-zinc-500">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {o.students.strugglingStudents.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="font-medium text-red-600">{s.avgGrade.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 font-semibold">Generate Report</h2>
        <div className="flex items-center gap-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as "daily" | "weekly" | "monthly")}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button
            onClick={generateReport}
            disabled={generatingReport}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {generatingReport ? "Generating..." : "Generate Report"}
          </button>
        </div>
        {report && (
          <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {report}
          </pre>
        )}
      </div>
    </div>
  );
}
