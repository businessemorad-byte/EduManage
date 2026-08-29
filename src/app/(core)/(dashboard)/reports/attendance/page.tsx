"use client";

import { useState, useEffect, Suspense } from "react";
import { CalendarCheck, Loader2, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { BarChart } from "@/components/reports/bar-chart";
import { TrendChart } from "@/components/reports/trend-chart";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ExportButton } from "@/components/reports/export-button";

type AttendanceData = {
  totalStudents: number; totalRecords: number; presentCount: number; absentCount: number; lateCount: number; excusedCount: number;
  rate: number | null;
  byGroup: { name: string; rate: number | null; total: number }[];
  byDay: { day: string; rate: number | null }[];
};

function AttendanceReportInner() {
  const sp = useSearchParams();
  const startDate = sp.get("startDate") || undefined;
  const endDate = sp.get("endDate") || undefined;
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    setLoading(true); setError("");
    fetch("/api/reports/attendance?" + params.toString()).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setData).catch(() => setError("Unable to load attendance report.")).finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <div className="space-y-6"><PageHeader icon={<CalendarCheck />} title="Attendance Report" description="Rates & trends" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-100 animate-pulse" />)}</div></div>;
  if (error) return <div className="space-y-6"><PageHeader icon={<CalendarCheck />} title="Attendance Report" description="Rates & trends" /><div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center"><AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" /><p className="text-sm font-medium text-rose-700">{error}</p><button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700">Retry</button></div></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader icon={<CalendarCheck />} title="Attendance Report" description="Attendance rates & trends" action={<ExportButton reportType="attendance" startDate={startDate} endDate={endDate} />} />
      <Suspense fallback={<div className="h-10 bg-zinc-100 rounded-lg animate-pulse" />}><DateRangePicker basePath="/reports/attendance" /></Suspense>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5"><p className="text-xs text-zinc-500">Overall Rate</p><p className="text-2xl font-bold text-zinc-900 mt-1">{data.rate !== null ? data.rate + "%" : "N/A"}</p></div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5"><p className="text-xs text-zinc-500">Present</p><p className="text-2xl font-bold text-emerald-600 mt-1">{data.presentCount}</p></div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5"><p className="text-xs text-zinc-500">Absent</p><p className="text-2xl font-bold text-rose-600 mt-1">{data.absentCount}</p></div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5"><p className="text-xs text-zinc-500">Late / Excused</p><p className="text-2xl font-bold text-amber-600 mt-1">{data.lateCount + data.excusedCount}</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart title="Attendance Rate by Group" data={data.byGroup.map(g => ({ label: g.name, value: g.rate || 0 }))} />
        {data.byDay.length > 0 && <TrendChart title="Rate by Day of Week" data={data.byDay.map(d => ({ label: d.day, value: d.rate || 0 }))} color="#8b5cf6" />}
      </div>
    </div>
  );
}

export default function AttendanceReportPage() {
  return <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 text-brand-600 animate-spin" /></div>}><AttendanceReportInner /></Suspense>;
}
