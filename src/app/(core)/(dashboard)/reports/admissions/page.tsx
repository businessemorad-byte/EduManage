"use client";

import { useState, useEffect, Suspense } from "react";
import { UserPlus, Loader2, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { BarChart } from "@/components/reports/bar-chart";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ExportButton } from "@/components/reports/export-button";

type AdmissionsData = {
  totalLeads: number; newLeads: number; totalAdmissions: number; converted: number; conversionRate: number;
  leadsByStatus: { status: string; count: number }[];
  admissionsByStatus: { status: string; count: number }[];
  totalTrials: number; trialsCompleted: number; trialConversion: number;
};

function AdmissionsReportInner() {
  const sp = useSearchParams();
  const startDate = sp.get("startDate") || undefined;
  const endDate = sp.get("endDate") || undefined;
  const [data, setData] = useState<AdmissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    setLoading(true); setError("");
    fetch("/api/reports/admissions?" + params.toString()).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setData).catch(() => setError("Unable to load admissions report.")).finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <div className="space-y-6"><PageHeader icon={<UserPlus />} title="Admissions Report" description="Leads & conversions" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-100 animate-pulse" />)}</div></div>;
  if (error) return <div className="space-y-6"><PageHeader icon={<UserPlus />} title="Admissions Report" description="Leads & conversions" /><div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center"><AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" /><p className="text-sm font-medium text-rose-700">{error}</p><button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700">Retry</button></div></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader icon={<UserPlus />} title="Admissions Report" description="Leads, trials & conversions" action={<ExportButton reportType="admissions" startDate={startDate} endDate={endDate} />} />
      <Suspense fallback={<div className="h-10 bg-zinc-100 rounded-lg animate-pulse" />}><DateRangePicker basePath="/reports/admissions" /></Suspense>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5"><p className="text-xs text-zinc-500">Total Leads</p><p className="text-2xl font-bold text-zinc-900 mt-1">{data.totalLeads}</p></div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5"><p className="text-xs text-zinc-500">Conversion Rate</p><p className="text-2xl font-bold text-brand-600 mt-1">{data.conversionRate}%</p></div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5"><p className="text-xs text-zinc-500">Trial Sessions</p><p className="text-2xl font-bold text-zinc-900 mt-1">{data.totalTrials}</p></div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5"><p className="text-xs text-zinc-500">Trial Conversion</p><p className="text-2xl font-bold text-emerald-600 mt-1">{data.trialConversion}%</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart title="Leads by Status" data={data.leadsByStatus.map(l => ({ label: l.status, value: l.count }))} />
        <BarChart title="Admissions by Status" data={data.admissionsByStatus.map(a => ({ label: a.status, value: a.count }))} />
      </div>
    </div>
  );
}

export default function AdmissionsReportPage() {
  return <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 text-brand-600 animate-spin" /></div>}><AdmissionsReportInner /></Suspense>;
}
