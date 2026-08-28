"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

type RetentionMetrics = {
  active: number;
  paused: number;
  completed: number;
  dropped: number;
  newEnrollments: number;
  retentionRate: number;
  byBranch: Array<{
    branchId: string;
    branchName: string;
    active: number;
    paused: number;
    completed: number;
    dropped: number;
    retentionRate: number;
  }>;
};

function RetentionInner() {
  const searchParams = useSearchParams();
  const [metrics, setMetrics] = useState<RetentionMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/retention?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setMetrics(data))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [searchParams]);

  if (loading) return <LoadingState />;
  if (!metrics) return <EmptyState title="No retention data" description="Data will appear once students are enrolled." />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Student Retention</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Active", value: metrics.active, color: "text-emerald-600" },
          { label: "Paused", value: metrics.paused, color: "text-amber-600" },
          { label: "Completed", value: metrics.completed, color: "text-blue-600" },
          { label: "Dropped", value: metrics.dropped, color: "text-red-600" },
          { label: "Retention Rate", value: `${metrics.retentionRate.toFixed(1)}%`, color: "text-zinc-900 dark:text-zinc-100" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {metrics.byBranch.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">By Branch</h2>
          <DataTable
            columns={[
              { key: "branchName", header: "Branch", render: (b: RetentionMetrics["byBranch"][0]) => <span className="font-medium">{b.branchName}</span> },
              { key: "active", header: "Active", render: (b: RetentionMetrics["byBranch"][0]) => b.active },
              { key: "paused", header: "Paused", render: (b: RetentionMetrics["byBranch"][0]) => b.paused },
              { key: "completed", header: "Completed", render: (b: RetentionMetrics["byBranch"][0]) => b.completed },
              { key: "dropped", header: "Dropped", render: (b: RetentionMetrics["byBranch"][0]) => b.dropped },
              { key: "retentionRate", header: "Rate", render: (b: RetentionMetrics["byBranch"][0]) => `${b.retentionRate.toFixed(1)}%` },
            ]}
            data={metrics.byBranch}
          />
        </div>
      )}
    </div>
  );
}

export default function RetentionPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <RetentionInner />
      </Suspense>
    </div>
  );
}
