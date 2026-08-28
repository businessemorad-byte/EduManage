"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

type Competency = {
  id: string;
  name: string;
  description: string | null;
  program: { name: string } | null;
  module: { name: string } | null;
  sortOrder: number;
  _count: { competencyRecords: number };
};

function CompetenciesListInner() {
  const searchParams = useSearchParams();
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/competencies?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setCompetencies(data.competencies ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [searchParams]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Competencies</h1>

      {competencies.length === 0 ? (
        <EmptyState title="No competencies found" description="Define competencies for your training programs." />
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "Competency", render: (c: Competency) => <span className="font-medium">{c.name}</span> },
            { key: "description", header: "Description", render: (c: Competency) => <span className="max-w-xs truncate block">{c.description ?? "—"}</span> },
            { key: "program", header: "Program", render: (c: Competency) => c.program?.name ?? "—" },
            { key: "module", header: "Module", render: (c: Competency) => c.module?.name ?? "—" },
            { key: "records", header: "Records", render: (c: Competency) => c._count.competencyRecords },
          ]}
          data={competencies}
        />
      )}
    </div>
  );
}

export default function CompetenciesPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <CompetenciesListInner />
      </Suspense>
    </div>
  );
}
