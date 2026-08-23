"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { CalendarDays } from "lucide-react";

type AcademicYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  isActive: boolean;
};

export function AcademicYearsList() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { data, loading, error } = useFetch<{ academicYears: AcademicYear[] }>("/api/academic-years");

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <EmptyState
        icon={<CalendarDays className="h-7 w-7" />}
        title="Failed to load academic years"
        description={error}
        action={
          <button onClick={() => window.location.reload()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Retry
          </button>
        }
      />
    );
  }

  const years = data?.academicYears ?? [];

  return (
    <div className="space-y-4">
      {years.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-7 w-7" />}
          title="No academic years"
          description="Create your first academic year to get started."
          action={
            <button onClick={() => startTransition(() => router.push("/academic-years/new"))} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              + Add Academic Year
            </button>
          }
        />
      ) : (
        <DataTable
          columns={[
            {
              key: "name",
              header: "Name",
              render: (y: AcademicYear) => (
                <span className="font-medium">{y.name}</span>
              ),
            },
            {
              key: "startDate",
              header: "Start",
              render: (y: AcademicYear) => new Date(y.startDate).toLocaleDateString(),
            },
            {
              key: "endDate",
              header: "End",
              render: (y: AcademicYear) => y.endDate ? new Date(y.endDate).toLocaleDateString() : "—",
            },
            {
              key: "isCurrent",
              header: "Status",
              render: (y: AcademicYear) =>
                y.isCurrent ? <StatusBadge status="ACTIVE" /> : <span className="text-zinc-400">Inactive</span>,
            },
          ]}
          data={years}
          onRowClick={(y) => startTransition(() => router.push(`/academic-years/${y.id}`))}
        />
      )}
    </div>
  );
}
