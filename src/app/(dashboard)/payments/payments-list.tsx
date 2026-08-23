"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { CreditCard } from "lucide-react";

type Payment = {
  id: string;
  receiptNumber: string;
  amount: string;
  method: string;
  status: string;
  paidAt: string;
  invoice: { invoiceNumber: string; totalAmount: string };
};

export function PaymentsList() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";

  const url = `/api/payments${status ? `?status=${status}` : ""}`;
  const { data, loading, error } = useFetch<{ payments: Payment[] }>(url);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <EmptyState
        icon={<CreditCard className="h-7 w-7" />}
        title="Failed to load payments"
        description={error}
        action={
          <button onClick={() => window.location.reload()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Retry</button>
        }
      />
    );
  }

  const payments = data?.payments ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search payments..." />
        </div>
        <FilterBar
          filters={[
            {
              key: "status",
              label: "All Statuses",
              options: [
                { value: "COMPLETED", label: "Completed" },
                { value: "PENDING", label: "Pending" },
                { value: "FAILED", label: "Failed" },
                { value: "REFUNDED", label: "Refunded" },
              ],
            },
          ]}
        />
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-7 w-7" />}
          title="No payments recorded yet"
          description="Payments will appear here."
        />
      ) : (
        <DataTable
          columns={[
            { key: "receiptNumber", header: "Receipt #", render: (p: Payment) => <span className="font-mono text-sm">{p.receiptNumber}</span> },
            { key: "invoice", header: "Invoice #", render: (p: Payment) => p.invoice.invoiceNumber },
            { key: "amount", header: "Amount", render: (p: Payment) => <span className="font-medium">{Number(p.amount).toLocaleString()} DH</span> },
            { key: "method", header: "Method", render: (p: Payment) => p.method.replace("_", " ") },
            { key: "status", header: "Status", render: (p: Payment) => <StatusBadge status={p.status} /> },
            { key: "paidAt", header: "Date", render: (p: Payment) => new Date(p.paidAt).toLocaleDateString() },
          ]}
          data={payments}
          onRowClick={(p) => startTransition(() => router.push(`/payments/${p.id}`))}
          searchQuery={search}
          searchKeys={["receiptNumber", "amount", "method", "invoice"]}
        />
      )}
    </div>
  );
}
