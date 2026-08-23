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

type Proposal = {
  id: string;
  title: string;
  corporateClient: { companyName: string } | null;
  learnerCount: number | null;
  estimatedDuration: string | null;
  proposedPrice: number;
  validUntil: string | null;
  status: string;
  createdAt: string;
};

function ProposalsListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/proposals?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setProposals(data.proposals ?? []);
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
        <h1 className="text-2xl font-bold tracking-tight">Proposals</h1>
        <button
          onClick={() => startTransition(() => router.push("/proposals/new"))}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Create Proposal
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search proposals..." />
        </div>
        <FilterBar
          filters={[
            {
              key: "status",
              label: "All Statuses",
              options: [
                { value: "DRAFT", label: "Draft" },
                { value: "SENT", label: "Sent" },
                { value: "ACCEPTED", label: "Accepted" },
                { value: "REJECTED", label: "Rejected" },
                { value: "EXPIRED", label: "Expired" },
              ],
            },
          ]}
        />
      </div>

      {proposals.length === 0 ? (
        <EmptyState title="No proposals found" description="Create your first proposal for a corporate client." />
      ) : (
        <>
          <DataTable
            columns={[
              { key: "title", header: "Title", render: (p: Proposal) => <span className="font-medium">{p.title}</span> },
              { key: "client", header: "Client", render: (p: Proposal) => p.corporateClient?.companyName ?? "—" },
              { key: "learners", header: "Learners", render: (p: Proposal) => p.learnerCount ?? "—" },
              { key: "duration", header: "Duration", render: (p: Proposal) => p.estimatedDuration ?? "—" },
              { key: "price", header: "Price", render: (p: Proposal) => `${Number(p.proposedPrice).toLocaleString()} DA` },
              { key: "validUntil", header: "Valid Until", render: (p: Proposal) => p.validUntil ? new Date(p.validUntil).toLocaleDateString() : "—" },
              { key: "status", header: "Status", render: (p: Proposal) => <StatusBadge status={p.status} /> },
              { key: "created", header: "Created", render: (p: Proposal) => new Date(p.createdAt).toLocaleDateString() },
            ]}
            data={proposals}
            onRowClick={(item) => startTransition(() => router.push(`/proposals/${item.id}`))}
          />
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

export default function ProposalsPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <ProposalsListInner />
      </Suspense>
    </div>
  );
}
