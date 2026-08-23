"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Users } from "lucide-react";

type Group = {
  id: string;
  name: string;
  code: string | null;
  capacity: number | null;
  academicYear: { name: string } | null;
  level: { name: string } | null;
  program: { name: string } | null;
  _count: { enrollments: number };
};

export function GroupsList() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { data, loading, error } = useFetch<{ groups: Group[] }>("/api/groups");

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <EmptyState
        icon={<Users className="h-7 w-7" />}
        title="Failed to load groups"
        description={error}
        action={
          <button onClick={() => window.location.reload()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Retry
          </button>
        }
      />
    );
  }

  const groups = data?.groups ?? [];

  return (
    <div className="space-y-4">
      {groups.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="No groups"
          description="Create your first class or cohort group."
          action={
            <button onClick={() => startTransition(() => router.push("/groups/new"))} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              + Add Group
            </button>
          }
        />
      ) : (
        <DataTable
          columns={[
            {
              key: "name",
              header: "Name",
              render: (g: Group) => <span className="font-medium">{g.name}</span>,
            },
            { key: "code", header: "Code", render: (g: Group) => g.code ?? "—" },
            { key: "academicYear", header: "Year", render: (g: Group) => g.academicYear?.name ?? "—" },
            { key: "level", header: "Level", render: (g: Group) => g.level?.name ?? "—" },
            { key: "program", header: "Program", render: (g: Group) => g.program?.name ?? "—" },
            {
              key: "enrollments",
              header: "Enrolled",
              render: (g: Group) => `${g._count.enrollments}${g.capacity ? ` / ${g.capacity}` : ""}`,
            },
          ]}
          data={groups}
          onRowClick={(g) => startTransition(() => router.push(`/groups/${g.id}`))}
        />
      )}
    </div>
  );
}
