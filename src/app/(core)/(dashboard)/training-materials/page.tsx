"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

type Material = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileUrl: string | null;
  externalUrl: string | null;
  mimeType: string | null;
  program: { name: string } | null;
  cohort: { name: string } | null;
  module: { name: string } | null;
  sortOrder: number;
};

function TrainingMaterialsListInner() {
  const searchParams = useSearchParams();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/training-materials?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setMaterials(data.materials ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [searchParams]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Training Materials</h1>

      {materials.length === 0 ? (
        <EmptyState title="No materials found" description="Upload training materials for your courses." />
      ) : (
        <DataTable
          columns={[
            { key: "title", header: "Title", render: (m: Material) => <span className="font-medium">{m.title}</span> },
            { key: "type", header: "Type", render: (m: Material) => <StatusBadge status={m.type} /> },
            { key: "program", header: "Program", render: (m: Material) => m.program?.name ?? "—" },
            { key: "module", header: "Module", render: (m: Material) => m.module?.name ?? "—" },
            { key: "cohort", header: "Cohort", render: (m: Material) => m.cohort?.name ?? "—" },
            { key: "mimeType", header: "Format", render: (m: Material) => m.mimeType ?? "—" },
          ]}
          data={materials}
        />
      )}
    </div>
  );
}

export default function TrainingMaterialsPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <TrainingMaterialsListInner />
      </Suspense>
    </div>
  );
}
