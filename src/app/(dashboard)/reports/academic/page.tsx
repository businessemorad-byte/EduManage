"use client";

import { useState, useEffect, Suspense } from "react";
import { BookOpen, Loader2, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { BarChart } from "@/components/reports/bar-chart";
import { TrendChart } from "@/components/reports/trend-chart";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ExportButton } from "@/components/reports/export-button";

type AcademicData = {
  totalAssessments: number; totalResults: number; overallAverage: number | null;
  bySubject: { name: string; average: number | null; count: number }[];
  byGroup: { name: string; average: number | null; count: number }[];
  byMonth: { month: string; average: number | null }[];
};

function AcademicReportInner() {
  const sp = useSearchParams();
  const startDate = sp.get("startDate") || undefined;
  const endDate = sp.get("endDate") || undefined;
  const [data, setData] = useState<AcademicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    setLoading(true); setError("");
    fetch("/api/reports/academic?" + params.toString()).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setData).catch(() => setError("Unable to load academic report.")).finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <div className="space-y-6"><PageHeader icon={<BookOpen />} title="Academic Report" description="Grades & performance" /><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div></div>;
  if (error) return <div className="space-y-6"><PageHeader icon={<BookOpen />} title="Academic Report" description="Grades & performance" /><div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-8 text-center"><AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" /><p className="text-sm font-medium text-rose-700 dark:text-rose-400">{error}</p><button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700">Retry</button></div></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader icon={<BookOpen />} title="Academic Report" description="Grades & performance analysis" action={<ExportButton reportType="academic" startDate={startDate} endDate={endDate} />} />
      <Suspense fallback={<div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />}><DateRangePicker basePath="/reports/academic" /></Suspense>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Total Assessments</p><p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{data.totalAssessments}</p></div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Total Results</p><p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{data.totalResults}</p></div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Overall Average</p><p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{data.overallAverage !== null ? data.overallAverage.toFixed(1) + "%" : "N/A"}</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart title="Average Score by Subject" data={data.bySubject.map(s => ({ label: s.name, value: s.average || 0 }))} />
        <BarChart title="Average Score by Group" data={data.byGroup.map(g => ({ label: g.name, value: g.average || 0 }))} />
      </div>
      {data.byMonth.length > 0 && <TrendChart title="Monthly Average Trend" data={data.byMonth.map(m => ({ label: m.month.slice(5), value: m.average || 0 }))} />}
    </div>
  );
}

export default function AcademicReportPage() {
  return <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 text-brand-600 animate-spin" /></div>}><AcademicReportInner /></Suspense>;
}
