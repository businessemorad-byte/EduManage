"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { DataTable } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { CalendarDays } from "lucide-react";

const DAY_SHORT: Record<string, string> = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun" };

type Session = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  group: { name: string } | null;
  teacher: { staff: { person: { firstName: string; lastName: string } } } | null;
  room: { name: string };
  subject: { name: string } | null;
  module: { name: string } | null;
};

export function SessionsList() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { data, loading, error } = useFetch<{ sessions: Session[] }>("/api/sessions");

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <EmptyState
        icon={<CalendarDays className="h-7 w-7" />}
        title="Failed to load sessions"
        description={error}
        action={<button onClick={() => window.location.reload()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Retry</button>}
      />
    );
  }

  const sessions = data?.sessions ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <FilterBar
          filters={[
            {
              key: "dayOfWeek",
              label: "All Days",
              options: Object.entries(DAY_SHORT).map(([value, label]) => ({ value, label })),
            },
          ]}
        />
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-7 w-7" />}
          title="No sessions scheduled"
          description="Create your first session to build your timetable."
          action={<a href="/sessions/new" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">+ New Session</a>}
        />
      ) : (
        <DataTable
          columns={[
            { key: "dayOfWeek", header: "Day", render: (s: Session) => <span className="font-medium">{DAY_SHORT[s.dayOfWeek] ?? s.dayOfWeek}</span> },
            { key: "subject", header: "Subject", render: (s: Session) => <span className="font-medium">{s.subject?.name ?? s.module?.name ?? "—"}</span> },
            { key: "teacher", header: "Teacher", render: (s: Session) => s.teacher ? `${s.teacher.staff.person.firstName} ${s.teacher.staff.person.lastName}` : "—" },
            { key: "group", header: "Group", render: (s: Session) => s.group?.name ?? "—" },
            { key: "room", header: "Room", render: (s: Session) => s.room.name },
            { key: "time", header: "Time", render: (s: Session) => <span className="font-mono text-sm">{s.startTime} – {s.endTime}</span> },
            { key: "isActive", header: "Status", render: (s: Session) => s.isActive ? <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600"><span className="h-1.5 w-1.5 rounded-full bg-green-500" />Active</span> : <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400"><span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />Inactive</span> },
          ]}
          data={sessions}
          onRowClick={(s) => startTransition(() => router.push(`/sessions/${s.id}`))}
        />
      )}
    </div>
  );
}
