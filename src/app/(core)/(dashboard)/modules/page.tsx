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

type ModuleItem = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  duration: string | null;
  isActive: boolean;
  program: { id: string; name: string } | null;
  _count: { classSessions: number; assessments: number; trainingMaterials: number };
};

function ModulesListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch("/api/modules?" + params.toString(), { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setModules(data.modules ?? []);
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
        <h1 className="text-2xl font-bold tracking-tight">Modules</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search modules..." />
        </div>
      </div>

      {modules.length === 0 ? (
        <EmptyState title="No modules found" description="Modules (courses) appear here once created under a program." />
      ) : (
        <>
          <DataTable
            columns={[
              { key: "name", header: "Module", render: (m: ModuleItem) => <span className="font-medium">{m.name}</span> },
              { key: "code", header: "Code", render: (m: ModuleItem) => m.code ?? "—" },
              { key: "program", header: "Program", render: (m: ModuleItem) => m.program?.name ?? "—" },
              { key: "duration", header: "Duration", render: (m: ModuleItem) => m.duration ?? "—" },
              { key: "sessions", header: "Sessions", render: (m: ModuleItem) => m._count.classSessions },
              { key: "assessments", header: "Assessments", render: (m: ModuleItem) => m._count.assessments },
              { key: "materials", header: "Materials", render: (m: ModuleItem) => m._count.trainingMaterials },
              { key: "status", header: "Status", render: (m: ModuleItem) => <StatusBadge status={m.isActive ? "ACTIVE" : "INACTIVE"} /> },
            ]}
            data={modules}
          />
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

export default function ModulesPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <ModulesListInner />
      </Suspense>
    </div>
  );
}
