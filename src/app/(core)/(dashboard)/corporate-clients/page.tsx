"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

type CorporateClient = {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  industry: string | null;
  status: string;
  _count: { contracts: number; corporateLearners: number };
};

function CorporateClientsListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [clients, setClients] = useState<CorporateClient[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/corporate-clients?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setClients(data.clients ?? []);
        setPagination(data.pagination ?? { page: 1, totalPages: 1, total: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [searchParams]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Corporate Clients</h1>
        <button
          onClick={() => startTransition(() => router.push("/corporate-clients/new"))}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Add Client
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search clients..." />
        </div>
        <FilterBar
          filters={[
            {
              key: "status",
              label: "All Statuses",
              options: [
                { value: "LEAD", label: "Lead" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
                { value: "BLOCKED", label: "Blocked" },
              ],
            },
          ]}
        />
      </div>

      {clients.length === 0 ? (
        <EmptyState title="No corporate clients found" description="Add your first corporate client to start B2B training." />
      ) : (
        <>
          <DataTable
            columns={[
              { key: "company", header: "Company", render: (c: CorporateClient) => <span className="font-medium">{c.companyName}</span> },
              { key: "contact", header: "Contact", render: (c: CorporateClient) => c.contactName },
              { key: "email", header: "Email", render: (c: CorporateClient) => c.contactEmail ?? "—" },
              { key: "phone", header: "Phone", render: (c: CorporateClient) => c.contactPhone ?? "—" },
              { key: "industry", header: "Industry", render: (c: CorporateClient) => c.industry ?? "—" },
              { key: "contracts", header: "Contracts", render: (c: CorporateClient) => c._count.contracts },
              { key: "learners", header: "Learners", render: (c: CorporateClient) => c._count.corporateLearners },
              { key: "status", header: "Status", render: (c: CorporateClient) => <StatusBadge status={c.status} /> },
            ]}
            data={clients}
            onRowClick={(item) => startTransition(() => router.push(`/corporate-clients/${item.id}`))}
          />
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

export default function CorporateClientsPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <CorporateClientsListInner />
      </Suspense>
    </div>
  );
}
