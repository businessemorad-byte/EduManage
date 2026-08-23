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

type Program = {
  id: string;
  name: string;
  code: string | null;
  trainingCategory: string | null;
  duration: string | null;
  level: string | null;
  price: number | null;
  certificateEligibility: boolean;
  programStatus: string;
  branch: { name: string } | null;
  _count: { groups: number };
};

function TrainingProgramsListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/training-programs?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setPrograms(data.programs ?? []);
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
        <h1 className="text-2xl font-bold tracking-tight">Training Programs</h1>
        <button
          onClick={() => startTransition(() => router.push("/training-programs/new"))}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add Program
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search programs..." />
        </div>
        <FilterBar
          filters={[
            {
              key: "status",
              label: "All Statuses",
              options: [
                { value: "DRAFT", label: "Draft" },
                { value: "ACTIVE", label: "Active" },
                { value: "ARCHIVED", label: "Archived" },
              ],
            },
            {
              key: "category",
              label: "All Categories",
              options: [
                { value: "PROFESSIONAL", label: "Professional" },
                { value: "TECHNICAL", label: "Technical" },
                { value: "LANGUAGE", label: "Language" },
                { value: "SOFT_SKILLS", label: "Soft Skills" },
                { value: "COMPLIANCE", label: "Compliance" },
                { value: "OTHER", label: "Other" },
              ],
            },
          ]}
        />
      </div>

      {programs.length === 0 ? (
        <EmptyState title="No programs found" description="Create your first training program to get started." />
      ) : (
        <>
          <DataTable
            columns={[
              { key: "name", header: "Program", render: (p: Program) => <span className="font-medium">{p.name}</span> },
              { key: "code", header: "Code", render: (p: Program) => p.code ?? "—" },
              { key: "category", header: "Category", render: (p: Program) => <StatusBadge status={p.trainingCategory ?? "—"} /> },
              { key: "duration", header: "Duration", render: (p: Program) => p.duration ?? "—" },
              { key: "level", header: "Level", render: (p: Program) => p.level ?? "—" },
              { key: "price", header: "Price", render: (p: Program) => p.price ? `${Number(p.price).toLocaleString()} DA` : "—" },
              { key: "cohorts", header: "Cohorts", render: (p: Program) => p._count.groups },
              { key: "status", header: "Status", render: (p: Program) => <StatusBadge status={p.programStatus} /> },
            ]}
            data={programs}
            onRowClick={(item) => startTransition(() => router.push(`/training-programs/${item.id}`))}
          />
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

export default function TrainingProgramsPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <TrainingProgramsListInner />
      </Suspense>
    </div>
  );
}
