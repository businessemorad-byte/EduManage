"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { BookOpen } from "lucide-react";

type Level = {
  id: string;
  name: string;
  code: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { groups?: number; subjects?: number };
};

export function LevelsList() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { data, loading, error } = useFetch<{ levels: Level[] }>("/api/levels");

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <EmptyState
        icon={<BookOpen className="h-7 w-7" />}
        title="Failed to load levels"
        description={error}
        action={
          <button onClick={() => window.location.reload()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Retry
          </button>
        }
      />
    );
  }

  const levels = data?.levels ?? [];

  return (
    <div className="space-y-4">
      {levels.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-7 w-7" />}
          title="No levels"
          description="Create your first academic level."
          action={
            <button onClick={() => startTransition(() => router.push("/levels/new"))} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              + Add Level
            </button>
          }
        />
      ) : (
        <DataTable
          columns={[
            {
              key: "sortOrder",
              header: "#",
              render: (l: Level) => <span className="text-zinc-400">{l.sortOrder}</span>,
            },
            {
              key: "name",
              header: "Name",
              render: (l: Level) => <span className="font-medium">{l.name}</span>,
            },
            { key: "code", header: "Code", render: (l: Level) => l.code ?? "—" },
            {
              key: "isActive",
              header: "Status",
              render: (l: Level) =>
                l.isActive ? <StatusBadge status="ACTIVE" /> : <StatusBadge status="ARCHIVED" />,
            },
          ]}
          data={levels}
          onRowClick={(l) => startTransition(() => router.push(`/levels/${l.id}`))}
        />
      )}
    </div>
  );
}
