"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useTransition } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { TrendingUp } from "lucide-react";

type Refund = {
  id: string;
  amount: string;
  reason: string | null;
  refundedAt: string;
  payment: { receiptNumber: string; amount: string; method: string };
  invoice: { invoiceNumber: string; studentName: string };
};

function RefundsListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const [, startTransition] = useTransition();
  const { data, loading, error } = useFetch<{ refunds: Refund[] }>("/api/refunds");

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-7 w-7" />}
        title="Failed to load refunds"
        description={error}
        action={
          <button onClick={() => window.location.reload()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Retry</button>
        }
      />
    );
  }

  const refunds = data?.refunds ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search refunds..." />
        </div>
      </div>

      {refunds.length === 0 ? (
        <EmptyState icon={<TrendingUp className="h-7 w-7" />} title="No refunds yet" description="Refunded payments will appear here." />
      ) : (
        <DataTable
          columns={[
            { key: "studentName", header: "Student", render: (r: Refund) => <span className="font-medium">{r.invoice.studentName}</span> },
            { key: "amount", header: "Refund Amount", render: (r: Refund) => <span className="font-semibold text-rose-600">{Number(r.amount).toLocaleString()} DH</span> },
            { key: "invoiceNumber", header: "Invoice #", render: (r: Refund) => <span className="font-mono text-sm">{r.invoice.invoiceNumber}</span> },
            { key: "paymentReceipt", header: "Original Receipt", render: (r: Refund) => <span className="font-mono text-sm">{r.payment.receiptNumber}</span> },
            { key: "reason", header: "Reason", render: (r: Refund) => r.reason ? <span className="max-w-[200px] truncate text-zinc-500">{r.reason}</span> : "—" },
            { key: "refundedAt", header: "Date", render: (r: Refund) => new Date(r.refundedAt).toLocaleDateString() },
          ]}
          data={refunds}
          searchQuery={search}
          searchKeys={["student", "reason"]}
          onRowClick={(r) => startTransition(() => router.push(`/refunds/${r.id}`))}
        />
      )}
    </div>
  );
}

export function RefundsList() {
  return (
    <Suspense fallback={<LoadingState />}>
      <RefundsListInner />
    </Suspense>
  );
}
