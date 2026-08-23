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

type Cohort = {
  id: string;
  name: string;
  program: { name: string };
  classTeacher: { user: { name: string } } | null;
  capacity: number | null;
  cohortStatus: string;
  startDate: string | null;
  endDate: string | null;
  _count: { enrollments: number };
};

function CohortsListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/cohorts?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setCohorts(data.cohorts ?? []);
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
        <h1 className="text-2xl font-bold tracking-tight">Cohorts</h1>
        <button
          onClick={() => startTransition(() => router.push("/cohorts/new"))}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add Cohort
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search cohorts..." />
        </div>
        <FilterBar
          filters={[
            {
              key: "status",
              label: "All Statuses",
              options: [
                { value: "PLANNED", label: "Planned" },
                { value: "OPEN", label: "Open" },
                { value: "ACTIVE", label: "Active" },
                { value: "COMPLETED", label: "Completed" },
                { value: "CANCELED", label: "Canceled" },
                { value: "ARCHIVED", label: "Archived" },
              ],
            },
          ]}
        />
      </div>

      {cohorts.length === 0 ? (
        <EmptyState title="No cohorts found" description="Create your first cohort to start enrolling learners." />
      ) : (
        <>
          <DataTable
            columns={[
              { key: "name", header: "Cohort", render: (c: Cohort) => <span className="font-medium">{c.name}</span> },
              { key: "program", header: "Program", render: (c: Cohort) => c.program.name },
              { key: "teacher", header: "Teacher", render: (c: Cohort) => c.classTeacher?.user.name ?? "—" },
              { key: "enrollment", header: "Enrolled", render: (c: Cohort) => `${c._count.enrollments}${c.capacity ? `/${c.capacity}` : ""}` },
              { key: "startDate", header: "Start", render: (c: Cohort) => c.startDate ? new Date(c.startDate).toLocaleDateString() : "—" },
              { key: "endDate", header: "End", render: (c: Cohort) => c.endDate ? new Date(c.endDate).toLocaleDateString() : "—" },
              { key: "status", header: "Status", render: (c: Cohort) => <StatusBadge status={c.cohortStatus} /> },
            ]}
            data={cohorts}
            onRowClick={(item) => startTransition(() => router.push(`/cohorts/${item.id}`))}
          />
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

export default function CohortsPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <CohortsListInner />
      </Suspense>
    </div>
  );
}
