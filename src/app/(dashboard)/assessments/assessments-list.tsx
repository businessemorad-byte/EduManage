"use client";

import { useFetch } from "@/hooks/use-fetch";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

type Assessment = {
  id: string;
  name: string;
  maxScore: number;
  weight: number | null;
  date: string | null;
  subject: { name: string } | null;
  module: { name: string } | null;
  _count: { grades: number };
};

export function AssessmentsList() {
  const { data, loading } = useFetch<{ assessments: Assessment[] }>("/api/assessments");

  if (loading) return <LoadingState />;

  const assessments = data?.assessments ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Assessments</h1>
        <a
          href="/assessments/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          New Assessment
        </a>
      </div>

      {assessments.length === 0 ? (
        <EmptyState title="No assessments" description="Create an assessment to get started." />
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "Name", render: (a: Assessment) => <span className="font-medium">{a.name}</span> },
            { key: "subject", header: "Subject", render: (a: Assessment) => a.subject?.name ?? a.module?.name ?? "—" },
            { key: "maxScore", header: "Max Score" },
            { key: "weight", header: "Weight", render: (a: Assessment) => a.weight ? `${a.weight}%` : "—" },
            { key: "grades", header: "Graded", render: (a: Assessment) => a._count.grades },
            { key: "date", header: "Date", render: (a: Assessment) => a.date ? new Date(a.date).toLocaleDateString() : "—" },
          ]}
          data={assessments}
        />
      )}
    </div>
  );
}
