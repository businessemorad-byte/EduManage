"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import Link from "next/link";

type OverviewData = {
  anomalies: { type: string; severity: string; title: string }[];
  recommendations: { type: string; priority: string; title: string }[];
  insights: { stats: { total: number; unread: number } };
  credits: { monthly: number; used: number; extra: number };
  overview: {
    students: { totalStudents: number; activeStudents: number; avgAttendanceRate: number };
    financial: { totalRevenue: number; totalPending: number; collectionRate: number };
    attendance: { overallRate: number; todayRate: number };
    academic: { overallAvgGrade: number };
  };
};

export default function AIDashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/control-center")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (!data) return <div className="text-sm text-zinc-500">Failed to load AI dashboard.</div>;

  const creditPct = data.credits.monthly > 0
    ? Math.round((data.credits.used / data.credits.monthly) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">AI Intelligence</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-500">Students</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{data.overview.students.activeStudents}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-500">Attendance</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{data.overview.attendance.overallRate}%</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-500">Revenue</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{data.overview.financial.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-500">Avg Grade</p>
          <p className="mt-1 text-2xl font-bold text-purple-600">{data.overview.academic.overallAvgGrade}%</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-500">Anomalies</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{data.anomalies.length}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-500">AI Credits</p>
          <p className="mt-1 text-2xl font-bold text-cyan-600">{creditPct}%</p>
          <p className="text-xs text-zinc-500">{data.credits.used}/{data.credits.monthly} used</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/ai/chat" className="rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50">
          <h3 className="font-semibold">AI Chat</h3>
          <p className="text-sm text-zinc-500">Ask questions about your data</p>
        </Link>
        <Link href="/ai/control-center" className="rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50">
          <h3 className="font-semibold">Control Center</h3>
          <p className="text-sm text-zinc-500">Executive dashboard</p>
        </Link>
        <Link href="/ai/action-center" className="rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50">
          <h3 className="font-semibold">Action Center</h3>
          <p className="text-sm text-zinc-500">Anomalies & recommendations</p>
        </Link>
        <Link href="/ai/knowledge" className="rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50">
          <h3 className="font-semibold">Knowledge Base</h3>
          <p className="text-sm text-zinc-500">Manage documents</p>
        </Link>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Top Anomalies</h2>
        {data.anomalies.length === 0 ? (
          <p className="text-sm text-zinc-500">No anomalies detected.</p>
        ) : (
          <div className="space-y-2">
            {data.anomalies.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    a.severity === "CRITICAL" ? "bg-red-100 text-red-700"
                    : a.severity === "WARNING" ? "bg-amber-100 text-amber-700"
                    : "bg-zinc-100 text-zinc-700"
                  }`}>{a.severity}</span>
                  <span className="text-sm">{a.title}</span>
                </div>
                <span className="text-xs text-zinc-500">{a.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
