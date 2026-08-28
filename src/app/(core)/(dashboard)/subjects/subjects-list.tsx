"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Award } from "lucide-react";

type Subject = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  level: { id: string; name: string } | null;
};

export function SubjectsList() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { data, loading, error } = useFetch<{ subjects: Subject[] }>("/api/subjects");

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <EmptyState
        icon={<Award className="h-7 w-7" />}
        title="Failed to load subjects"
        description={error}
        action={
          <button onClick={() => window.location.reload()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Retry
          </button>
        }
      />
    );
  }

  const subjects = data?.subjects ?? [];

  return (
    <div className="space-y-4">
      {subjects.length === 0 ? (
        <EmptyState
          icon={<Award className="h-7 w-7" />}
          title="No subjects"
          description="Create your first subject."
          action={
            <button onClick={() => startTransition(() => router.push("/subjects/new"))} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              + Add Subject
            </button>
          }
        />
      ) : (
        <DataTable
          columns={[
            {
              key: "name",
              header: "Name",
              render: (s: Subject) => <span className="font-medium">{s.name}</span>,
            },
            { key: "code", header: "Code", render: (s: Subject) => s.code ?? "—" },
            { key: "level", header: "Level", render: (s: Subject) => s.level?.name ?? "—" },
            {
              key: "isActive",
              header: "Status",
              render: (s: Subject) =>
                s.isActive ? <StatusBadge status="ACTIVE" /> : <StatusBadge status="ARCHIVED" />,
            },
          ]}
          data={subjects}
          onRowClick={(s) => startTransition(() => router.push(`/subjects/${s.id}`))}
        />
      )}
    </div>
  );
}
