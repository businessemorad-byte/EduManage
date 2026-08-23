"use client";

import { useFetch } from "@/hooks/use-fetch";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatCardSkeleton } from "@/components/dashboard/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { DollarSign, TrendingUp, AlertCircle, RotateCcw, FileText, Percent } from "lucide-react";

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type FinanceData = {
  summary: {
    totalInvoiced: string;
    totalPaid: string;
    totalRefunded: string;
    totalOutstanding: string;
  };
  recentPayments: {
    id: string;
    receiptNumber: string;
    amount: string;
    method: string;
    status: string;
    paidAt: string;
    invoice: { invoiceNumber: string; studentName: string };
  }[];
  outstanding: {
    id: string;
    invoiceNumber: string;
    totalAmount: string;
    paidAmount: string;
    outstanding: string;
    status: string;
    dueDate: string | null;
    studentName: string;
  }[];
  collectionRate: number;
  monthlyRevenue: { month: string; amount: number }[];
};

function RevenueChart({ data }: { data: { month: string; amount: number }[] }) {
  const max = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="rounded-xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Revenue (Last 6 Months)</h3>
        <span className="text-xs text-zinc-400">DH</span>
      </div>
      <div className="flex items-end gap-2" style={{ height: 160 }}>
        {data.map((d) => {
          const pct = max > 0 ? (d.amount / max) * 100 : 0;
          const monthLabel = SHORT_MONTHS[parseInt(d.month.split("-")[1], 10) - 1];
          return (
            <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                {d.amount > 0 ? `${(d.amount / 1000).toFixed(0)}k` : "—"}
              </span>
              <div
                className="w-full rounded-t-md bg-brand-500 transition-all duration-300"
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
              <span className="text-[10px] text-zinc-400">{monthLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FinanceDashboard() {
  const { data, loading, error } = useFetch<FinanceData>("/api/finance/dashboard");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const s = data?.summary ?? { totalInvoiced: "0", totalPaid: "0", totalRefunded: "0", totalOutstanding: "0" };
  const payments = data?.recentPayments ?? [];
  const outstanding = data?.outstanding ?? [];
  const monthlyRevenue = data?.monthlyRevenue ?? [];

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Revenue" value={`${Number(s.totalPaid).toLocaleString()} DH`} icon={<DollarSign className="h-5 w-5" />} gradient="blue" />
        <StatCard label="Total Invoiced" value={`${Number(s.totalInvoiced).toLocaleString()} DH`} icon={<FileText className="h-5 w-5" />} gradient="slate" />
        <StatCard label="Outstanding" value={`${Number(s.totalOutstanding).toLocaleString()} DH`} icon={<AlertCircle className="h-5 w-5" />} gradient="amber" />
        <StatCard label="Refunds" value={`${Number(s.totalRefunded).toLocaleString()} DH`} icon={<RotateCcw className="h-5 w-5" />} gradient="rose" />
        <StatCard label="Collection Rate" value={`${data?.collectionRate ?? 0}%`} icon={<Percent className="h-5 w-5" />} gradient="green" />
        <StatCard label="Active Invoices" value={String(outstanding.length)} icon={<FileText className="h-5 w-5" />} gradient="slate" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {monthlyRevenue.length > 0 && <RevenueChart data={monthlyRevenue} />}
        </div>
        <div className="rounded-xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Outstanding Balances</h3>
          {outstanding.length === 0 ? (
            <EmptyState icon={<AlertCircle className="h-7 w-7" />} title="All clear" description="No outstanding invoices." />
          ) : (
            <div className="space-y-3">
              {outstanding.slice(0, 5).map((o) => (
                <div key={o.id} className="rounded-lg border p-3 dark:border-zinc-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{o.studentName}</span>
                    <span className="text-sm font-semibold text-amber-600">{Number(o.outstanding).toLocaleString()} DH</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                    <StatusBadge status={o.status} />
                    {o.dueDate && <span>Due {new Date(o.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Recent Payments</h3>
        {payments.length === 0 ? (
          <EmptyState icon={<DollarSign className="h-7 w-7" />} title="No payments yet" description="Payments will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-zinc-700">
                  <th className="pb-2 text-left font-medium text-zinc-500">Student</th>
                  <th className="pb-2 text-right font-medium text-zinc-500">Amount</th>
                  <th className="pb-2 text-left font-medium text-zinc-500">Method</th>
                  <th className="pb-2 text-left font-medium text-zinc-500">Status</th>
                  <th className="pb-2 text-left font-medium text-zinc-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b dark:border-zinc-800">
                    <td className="py-3 font-medium">{p.invoice.studentName}</td>
                    <td className="py-3 text-right">{Number(p.amount).toLocaleString()} DH</td>
                    <td className="py-3 text-zinc-500">{p.method.replace("_", " ")}</td>
                    <td className="py-3"><StatusBadge status={p.status} /></td>
                    <td className="py-3 text-zinc-500">{new Date(p.paidAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
