"use client";

import { useState, useEffect, Suspense } from "react";
import { Users, Loader2, AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { BarChart } from "@/components/reports/bar-chart";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ExportButton } from "@/components/reports/export-button";

type PeopleData = {
  totalStudents: number; activeStudents: number; inactiveStudents: number; newRegistrations: number;
  byGroup: { name: string; count: number }[];
  byLevel: { name: string; count: number }[];
  staffByType: { type: string; count: number }[];
};

function PeopleReportInner() {
  const sp = useSearchParams();
  const startDate = sp.get("startDate") || undefined;
  const endDate = sp.get("endDate") || undefined;
  const [data, setData] = useState<PeopleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    setLoading(true); setError("");
    fetch("/api/reports/people?" + params.toString()).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setData).catch(() => setError("Unable to load people report. Please try again.")).finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <div className="space-y-6"><PageHeader icon={<Users />} title="People Report" description="Students, staff & group breakdown" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div></div>;
  if (error) return <div className="space-y-6"><PageHeader icon={<Users />} title="People Report" description="Students, staff & group breakdown" /><div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-8 text-center"><AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" /><p className="text-sm font-medium text-rose-700 dark:text-rose-400">{error}</p><button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700">Retry</button></div></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader icon={<Users />} title="People Report" description="Students, staff & group breakdown" action={<ExportButton reportType="people" startDate={startDate} endDate={endDate} />} />
      <Suspense fallback={<div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />}><DateRangePicker basePath="/reports/people" /></Suspense>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: data.totalStudents },
          { label: "Active Students", value: data.activeStudents },
          { label: "Inactive Students", value: data.inactiveStudents },
          { label: "New Registrations", value: data.newRegistrations },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.label}</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart title="Students by Group" data={data.byGroup.map(g => ({ label: g.name, value: g.count }))} />
        <BarChart title="Students by Level" data={data.byLevel.map(l => ({ label: l.name, value: l.count }))} />
      </div>
      {data.staffByType.length > 0 && (
        <BarChart title="Staff by Type" data={data.staffByType.map(s => ({ label: s.type, value: s.count }))} />
      )}
    </div>
  );
}

export default function PeopleReportPage() {
  return <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 text-brand-600 animate-spin" /></div>}><PeopleReportInner /></Suspense>;
}
