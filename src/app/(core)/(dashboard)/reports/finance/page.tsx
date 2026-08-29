"use client";

import { useState, useEffect, Suspense } from "react";
import { Wallet, Loader2, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { BarChart } from "@/components/reports/bar-chart";
import { TrendChart } from "@/components/reports/trend-chart";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ExportButton } from "@/components/reports/export-button";

type FinanceData = {
  totalInvoiced: number; totalPaid: number; totalRefunded: number; totalOutstanding: number; overdue: number; collectionRate: number;
  byMethod: { method: string; amount: number }[];
  byMonth: { month: string; invoiced: number; paid: number }[];
};

function fmt(n: number) { return n.toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " DH"; }

function FinanceReportInner() {
  const sp = useSearchParams();
  const startDate = sp.get("startDate") || undefined;
  const endDate = sp.get("endDate") || undefined;
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    setLoading(true); setError("");
    fetch("/api/reports/finance?" + params.toString()).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setData).catch(() => setError("Unable to load finance report.")).finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <div className="space-y-6"><PageHeader icon={<Wallet />} title="Finance Report" description="Revenue & collection" /><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-100 animate-pulse" />)}</div></div>;
  if (error) return <div className="space-y-6"><PageHeader icon={<Wallet />} title="Finance Report" description="Revenue & collection" /><div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center"><AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" /><p className="text-sm font-medium text-rose-700">{error}</p><button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700">Retry</button></div></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader icon={<Wallet />} title="Finance Report" description="Revenue, payments & collection rate" action={<ExportButton reportType="finance" startDate={startDate} endDate={endDate} />} />
      <Suspense fallback={<div className="h-10 bg-zinc-100 rounded-lg animate-pulse" />}><DateRangePicker basePath="/reports/finance" /></Suspense>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5"><p className="text-xs text-zinc-500">Total Invoiced</p><p className="text-xl font-bold text-zinc-900 mt-1">{fmt(data.totalInvoiced)}</p></div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5"><p className="text-xs text-zinc-500">Total Collected</p><p className="text-xl font-bold text-emerald-600 mt-1">{fmt(data.totalPaid)}</p></div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5"><p className="text-xs text-zinc-500">Outstanding</p><p className="text-xl font-bold text-amber-600 mt-1">{fmt(data.totalOutstanding)}</p></div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5"><p className="text-xs text-zinc-500">Collection Rate</p><p className="text-2xl font-bold text-zinc-900 mt-1">{data.collectionRate}%</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart title="Monthly Revenue vs Collected" data={data.byMonth.map(m => ({ label: m.month.slice(5), value: m.invoiced }))} color="#f59e0b" />
        <BarChart title="Payments by Method" data={data.byMethod.map(m => ({ label: m.method, value: m.amount }))} />
      </div>
      {data.overdue > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-medium text-amber-700">Overdue Amount: {fmt(data.overdue)}</p>
          <p className="text-xs text-amber-600 mt-1">Consider following up on outstanding invoices</p>
        </div>
      )}
    </div>
  );
}

export default function FinanceReportPage() {
  return <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 text-brand-600 animate-spin" /></div>}><FinanceReportInner /></Suspense>;
}
