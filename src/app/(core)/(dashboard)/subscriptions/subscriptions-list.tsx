"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useTransition } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { FilterBar } from "@/components/ui/filter-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { CalendarDays } from "lucide-react";

type Subscription = {
  id: string;
  month: number;
  year: number;
  amount: string;
  discountAmount: string;
  status: string;
  dueDate: string | null;
  student: { person: { firstName: string; lastName: string } };
  feePlan: { name: string };
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function SubscriptionsListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const [, startTransition] = useTransition();
  const { data, loading, error } = useFetch<{ subscriptions: Subscription[] }>(
    `/api/monthly-subscriptions?${searchParams.toString()}`
  );

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <EmptyState
        icon={<CalendarDays className="h-7 w-7" />}
        title="Failed to load subscriptions"
        description={error}
        action={
          <button onClick={() => window.location.reload()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Retry</button>
        }
      />
    );
  }

  const subs = data?.subscriptions ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search subscriptions..." />
        </div>
        <FilterBar
          filters={[
            {
              key: "status",
              label: "All Statuses",
              options: [
                { value: "PENDING", label: "Pending" },
                { value: "PAID", label: "Paid" },
                { value: "OVERDUE", label: "Overdue" },
                { value: "CANCELLED", label: "Cancelled" },
              ],
            },
          ]}
        />
      </div>

      {subs.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-7 w-7" />} title="No subscriptions" description="Monthly subscriptions will appear here." />
      ) : (
        <DataTable
          columns={[
            { key: "student", header: "Student", render: (s: Subscription) => <span className="font-medium">{s.student.person.firstName} {s.student.person.lastName}</span> },
            { key: "feePlan", header: "Fee Plan", render: (s: Subscription) => s.feePlan.name },
            { key: "period", header: "Month", render: (s: Subscription) => `${MONTHS[s.month - 1]} ${s.year}` },
            { key: "amount", header: "Amount", render: (s: Subscription) => `${Number(s.amount).toLocaleString()} DH` },
            { key: "discountAmount", header: "Discount", render: (s: Subscription) => { const d = Number(s.discountAmount); return d > 0 ? <span className="text-rose-600">-{d.toLocaleString()} DH</span> : "—"; } },
            { key: "dueDate", header: "Due Date", render: (s: Subscription) => s.dueDate ? new Date(s.dueDate).toLocaleDateString() : "—" },
            { key: "status", header: "Status", render: (s: Subscription) => <StatusBadge status={s.status} /> },
          ]}
          data={subs}
          searchQuery={search}
          searchKeys={["student", "feePlan"]}
          onRowClick={(s) => startTransition(() => router.push(`/subscriptions/${s.id}`))}
        />
      )}
    </div>
  );
}

export function SubscriptionsList() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SubscriptionsListInner />
    </Suspense>
  );
}
