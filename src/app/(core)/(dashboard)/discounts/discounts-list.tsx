"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useTransition } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Coins } from "lucide-react";

type Discount = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  value: number;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
};

function DiscountsListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const [, startTransition] = useTransition();
  const { data, loading, error } = useFetch<{ discounts: Discount[] }>("/api/discounts");

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <EmptyState
        icon={<Coins className="h-7 w-7" />}
        title="Failed to load discounts"
        description={error}
        action={
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Retry
          </button>
        }
      />
    );
  }

  const discounts = data?.discounts ?? [];

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (d: Discount) => (
        <div>
          <span className="font-medium">{d.name}</span>
          {d.description && (
            <p className="text-xs text-zinc-400">{d.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (d: Discount) => (
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
          {d.type === "PERCENTAGE" ? "%" : "DH"}
        </span>
      ),
    },
    {
      key: "value",
      header: "Value",
      render: (d: Discount) => (
        <span className="font-medium">
          {d.type === "PERCENTAGE" ? `${d.value}%` : `${d.value} DH`}
        </span>
      ),
    },
    {
      key: "usage",
      header: "Usage",
      render: (d: Discount) => (
        <span className="text-zinc-500">
          {d.maxUses != null ? `${d.usedCount} / ${d.maxUses}` : "Unlimited"}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Active",
      render: (d: Discount) => (
        <span className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${d.isActive ? "bg-emerald-500" : "bg-red-500"}`}
          />
          <span className="text-xs text-zinc-500">
            {d.isActive ? "Active" : "Inactive"}
          </span>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {discounts.length === 0 ? (
        <EmptyState
          icon={<Coins className="h-7 w-7" />}
          title="No discounts"
          description="Create discounts to offer special pricing."
          action={
            <button
              onClick={() => startTransition(() => router.push("/discounts/new"))}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              + Create Discount
            </button>
          }
        />
      ) : (
        <>
          <div className="w-72">
            <SearchInput placeholder="Search discounts..." />
          </div>
          <DataTable columns={columns} data={discounts} searchQuery={search} searchKeys={["name", "description"]} />
        </>
      )}
    </div>
  );
}

export function DiscountsList() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DiscountsListInner />
    </Suspense>
  );
}
