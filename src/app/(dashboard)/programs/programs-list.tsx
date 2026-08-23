"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { FileText } from "lucide-react";

type Program = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  _count: { modules: number; groups: number };
};

export function ProgramsList() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { data, loading, error } = useFetch<{ programs: Program[] }>("/api/programs");

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <EmptyState
        icon={<FileText className="h-7 w-7" />}
        title="Failed to load programs"
        description={error}
        action={
          <button onClick={() => window.location.reload()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Retry
          </button>
        }
      />
    );
  }

  const programs = data?.programs ?? [];

  return (
    <div className="space-y-4">
      {programs.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-7 w-7" />}
          title="No programs"
          description="Create your first program."
          action={
            <button onClick={() => startTransition(() => router.push("/programs/new"))} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              + Add Program
            </button>
          }
        />
      ) : (
        <DataTable
          columns={[
            {
              key: "name",
              header: "Name",
              render: (p: Program) => <span className="font-medium">{p.name}</span>,
            },
            { key: "code", header: "Code", render: (p: Program) => p.code ?? "—" },
            { key: "modules", header: "Modules", render: (p: Program) => String(p._count.modules) },
            { key: "groups", header: "Groups", render: (p: Program) => String(p._count.groups) },
          ]}
          data={programs}
          onRowClick={(p) => startTransition(() => router.push(`/programs/${p.id}`))}
        />
      )}
    </div>
  );
}
