"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useTransition } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Wallet } from "lucide-react";

type FeePlan = {
  id: string;
  name: string;
  description: string | null;
  amount: string;
  currency: string;
  frequency: string;
  isActive: boolean;
};

const FREQUENCY_LABELS: Record<string, string> = {
  ONE_TIME: "One-time",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
  CUSTOM: "Custom",
};

function FeePlansListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const [, startTransition] = useTransition();
  const { data, loading, error } = useFetch<{ feePlans: FeePlan[] }>("/api/fee-plans");

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <EmptyState
        icon={<Wallet className="h-7 w-7" />}
        title="Failed to load fee plans"
        description={error}
        action={
          <button onClick={() => window.location.reload()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Retry
          </button>
        }
      />
    );
  }

  const feePlans = data?.feePlans ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search fee plans..." />
        </div>
      </div>

      {feePlans.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-7 w-7" />}
          title="No fee plans"
          description="Create fee plans to structure your invoicing."
          action={
            <button onClick={() => startTransition(() => router.push("/fee-plans/new"))} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              + Create Fee Plan
            </button>
          }
        />
      ) : (
        <DataTable
          columns={[
            {
              key: "name",
              header: "Name",
              render: (p: FeePlan) => <span className="font-medium">{p.name}</span>,
            },
            {
              key: "description",
              header: "Description",
              render: (p: FeePlan) =>
                p.description ? (
                  <span className="block max-w-xs truncate text-zinc-500 dark:text-zinc-400">{p.description}</span>
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-600">—</span>
                ),
            },
            {
              key: "amount",
              header: "Amount",
              render: (p: FeePlan) => (
                <span className="font-medium tabular-nums">{`${Number(p.amount).toLocaleString()} DH`}</span>
              ),
            },
            {
              key: "frequency",
              header: "Frequency",
              render: (p: FeePlan) => FREQUENCY_LABELS[p.frequency] ?? p.frequency,
            },
            {
              key: "isActive",
              header: "Active",
              render: (p: FeePlan) => (
                <span className="inline-flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${p.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                  <span className={p.isActive ? "text-zinc-600 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500"}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </span>
              ),
            },
          ]}
          data={feePlans}
          searchQuery={search}
          searchKeys={["name", "description"]}
        />
      )}
    </div>
  );
}

export function FeePlansList() {
  return (
    <Suspense fallback={<LoadingState />}>
      <FeePlansListInner />
    </Suspense>
  );
}
