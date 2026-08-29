"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { PieChart } from "lucide-react";

type Balance = {
  studentId: string;
  studentName: string;
  totalFees: string;
  paid: string;
  outstanding: string;
  overdueCount: number;
};

export default function BalancesPage() {
  const { data, loading, error } = useFetch<{ balances: Balance[] }>("/api/finance/balances");
  const [search, setSearch] = useState("");

  if (loading) return <LoadingState />;

  const balances = data?.balances ?? [];
  const filtered = search
    ? balances.filter((b) => b.studentName.toLowerCase().includes(search.toLowerCase()))
    : balances;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Student Balances" description="Outstanding balances per student." icon={<PieChart className="h-5 w-5" />} />

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-600">{error}</div>}

      <div className="flex items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search students..." />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<PieChart className="h-7 w-7" />} title="No outstanding balances" description="All student accounts are settled." />
      ) : (
        <DataTable
          columns={[
            { key: "studentName", header: "Student", render: (b: Balance) => <span className="font-medium">{b.studentName}</span> },
            { key: "totalFees", header: "Total Fees", render: (b: Balance) => `${Number(b.totalFees).toLocaleString()} DH` },
            { key: "paid", header: "Paid", render: (b: Balance) => <span className="text-green-600">{Number(b.paid).toLocaleString()} DH</span> },
            {
              key: "outstanding", header: "Outstanding", render: (b: Balance) => {
                const val = Number(b.outstanding);
                return <span className={val > 0 ? "font-semibold text-amber-600" : "text-green-600"}>{val.toLocaleString()} DH</span>;
              },
            },
            {
              key: "overdueCount", header: "Overdue", render: (b: Balance) => {
                return b.overdueCount > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    {b.overdueCount}
                  </span>
                ) : <span className="text-zinc-400">—</span>;
              },
            },
          ]}
          data={filtered}
        />
      )}
    </div>
  );
}
