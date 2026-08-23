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
import { FileText } from "lucide-react";

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: string;
  paidAmount: string;
  dueDate: string | null;
  issuedAt: string;
  student: { person: { firstName: string; lastName: string } };
};

export function InvoicesList() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";

  const url = `/api/invoices${status ? `?status=${status}` : ""}`;
  const { data, loading, error } = useFetch<{ invoices: Invoice[] }>(url);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <EmptyState
        icon={<FileText className="h-7 w-7" />}
        title="Failed to load invoices"
        description={error}
        action={
          <button onClick={() => window.location.reload()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Retry
          </button>
        }
      />
    );
  }

  const invoices = data?.invoices ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search invoices..." />
        </div>
        <FilterBar
          filters={[
            {
              key: "status",
              label: "All Statuses",
              options: [
                { value: "DRAFT", label: "Draft" },
                { value: "PENDING", label: "Pending" },
                { value: "PARTIAL", label: "Partially Paid" },
                { value: "PAID", label: "Paid" },
                { value: "OVERDUE", label: "Overdue" },
                { value: "CANCELLED", label: "Cancelled" },
              ],
            },
          ]}
        />
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-7 w-7" />}
          title="No invoices yet"
          description="Create an invoice to get started."
          action={
            <button onClick={() => startTransition(() => router.push("/invoices/new"))} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              + Create Invoice
            </button>
          }
        />
      ) : (
        <DataTable
          columns={[
            { key: "invoiceNumber", header: "Invoice #", render: (i: Invoice) => <span className="font-medium font-mono text-sm">{i.invoiceNumber}</span> },
            { key: "student", header: "Student", render: (i: Invoice) => <span className="font-medium">{i.student.person.firstName} {i.student.person.lastName}</span> },
            { key: "totalAmount", header: "Total", render: (i: Invoice) => `${Number(i.totalAmount).toLocaleString()} DH` },
            { key: "paidAmount", header: "Paid", render: (i: Invoice) => `${Number(i.paidAmount).toLocaleString()} DH` },
            { key: "status", header: "Status", render: (i: Invoice) => <StatusBadge status={i.status} /> },
            { key: "dueDate", header: "Due Date", render: (i: Invoice) => i.dueDate ? new Date(i.dueDate).toLocaleDateString() : "—" },
          ]}
          data={invoices}
          onRowClick={(i) => startTransition(() => router.push(`/invoices/${i.id}`))}
          searchQuery={search}
          searchKeys={["invoiceNumber", "student"]}
        />
      )}
    </div>
  );
}
