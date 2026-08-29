"use client";

import { useFetch } from "@/hooks/use-fetch";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

type AttendanceRecord = {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  student: { person: { firstName: string; lastName: string } };
  group: { name: string } | null;
  classSession: { dayOfWeek: string; startTime: string; endTime: string } | null;
};

export function AttendanceList() {
  const { data, loading } = useFetch<{ records: AttendanceRecord[] }>("/api/attendance");

  if (loading) return <LoadingState />;

  const records = data?.records ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
        <a
          href="/attendance/mark"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Mark Attendance
        </a>
      </div>

      {records.length === 0 ? (
        <EmptyState title="No attendance records" description="Mark attendance to get started." />
      ) : (
        <DataTable
          columns={[
            {
              key: "date",
              header: "Date",
              render: (r: AttendanceRecord) => new Date(r.date).toLocaleDateString(),
            },
            {
              key: "student",
              header: "Student",
              render: (r: AttendanceRecord) => (
                <span className="font-medium">
                  {r.student.person.firstName} {r.student.person.lastName}
                </span>
              ),
            },
            { key: "group", header: "Group", render: (r: AttendanceRecord) => r.group?.name ?? "—" },
            { key: "status", header: "Status", render: (r: AttendanceRecord) => <StatusBadge status={r.status} /> },
            { key: "notes", header: "Notes", render: (r: AttendanceRecord) => r.notes ?? "—" },
          ]}
          data={records}
        />
      )}
    </div>
  );
}
