"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useTransition } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { FileOutput } from "lucide-react";

type Receipt = {
  id: string;
  receiptNumber: string;
  amount: string;
  method: string;
  status: string;
  paidAt: string;
  invoice: { invoiceNumber: string; studentName: string };
};

function ReceiptsListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const [, startTransition] = useTransition();
  const { data, loading, error } = useFetch<{ receipts: Receipt[] }>("/api/receipts");

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <EmptyState
        icon={<FileOutput className="h-7 w-7" />}
        title="Failed to load receipts"
        description={error}
        action={
          <button onClick={() => window.location.reload()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Retry
          </button>
        }
      />
    );
  }

  const receipts = data?.receipts ?? [];

  if (receipts.length === 0) {
    return (
      <EmptyState
        icon={<FileOutput className="h-7 w-7" />}
        title="No receipts yet"
        description="Completed payments will generate receipts."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search receipts..." />
        </div>
      </div>

      <DataTable
        columns={[
          { key: "receiptNumber", header: "Receipt #", render: (r: Receipt) => <span className="font-medium font-mono text-sm">{r.receiptNumber}</span> },
          { key: "invoiceNumber", header: "Invoice #", render: (r: Receipt) => <span className="font-mono text-sm text-zinc-500">{r.invoice.invoiceNumber}</span> },
          { key: "student", header: "Student", render: (r: Receipt) => <span className="font-medium">{r.invoice.studentName}</span> },
          { key: "amount", header: "Amount", render: (r: Receipt) => <span className="font-semibold text-green-600">{`${Number(r.amount).toLocaleString()} DH`}</span> },
          { key: "method", header: "Method", render: (r: Receipt) => r.method },
          { key: "status", header: "Status", render: (r: Receipt) => <StatusBadge status={r.status} /> },
          { key: "paidAt", header: "Date", render: (r: Receipt) => new Date(r.paidAt).toLocaleDateString() },
        ]}
        data={receipts}
        searchQuery={search}
        searchKeys={["receiptNumber", "student"]}
        onRowClick={(r) => startTransition(() => router.push(`/receipts/${r.id}`))}
      />
    </div>
  );
}

export function ReceiptsList() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ReceiptsListInner />
    </Suspense>
  );
}
