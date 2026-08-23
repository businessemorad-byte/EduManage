"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  program: { name: string } | null;
  cohort: { name: string } | null;
  module: { name: string } | null;
  deadline: string | null;
  maxScore: number | null;
  _count: { submissions: number };
};

function TrainingAssignmentsListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/training-assignments?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setAssignments(data.assignments ?? []);
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
        <h1 className="text-2xl font-bold tracking-tight">Training Assignments</h1>
        <button
          onClick={() => startTransition(() => router.push("/training-assignments/new"))}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add Assignment
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search assignments..." />
        </div>
        <FilterBar
          filters={[
            {
              key: "programId",
              label: "All Programs",
              options: [],
            },
          ]}
        />
      </div>

      {assignments.length === 0 ? (
        <EmptyState title="No assignments found" description="Create your first training assignment." />
      ) : (
        <>
          <DataTable
            columns={[
              { key: "title", header: "Title", render: (a: Assignment) => <span className="font-medium">{a.title}</span> },
              { key: "program", header: "Program", render: (a: Assignment) => a.program?.name ?? "—" },
              { key: "cohort", header: "Cohort", render: (a: Assignment) => a.cohort?.name ?? "—" },
              { key: "module", header: "Module", render: (a: Assignment) => a.module?.name ?? "—" },
              { key: "deadline", header: "Deadline", render: (a: Assignment) => a.deadline ? new Date(a.deadline).toLocaleDateString() : "—" },
              { key: "maxScore", header: "Max Score", render: (a: Assignment) => a.maxScore ?? "—" },
              { key: "submissions", header: "Submissions", render: (a: Assignment) => a._count.submissions },
            ]}
            data={assignments}
            onRowClick={(item) => startTransition(() => router.push(`/training-assignments/${item.id}`))}
          />
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

export default function TrainingAssignmentsPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <TrainingAssignmentsListInner />
      </Suspense>
    </div>
  );
}
