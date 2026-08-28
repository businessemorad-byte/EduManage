"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useFetch } from "@/hooks/use-fetch";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ClipboardCheck } from "lucide-react";

type Enrollment = {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  student: {
    id: string;
    person: { firstName: string; lastName: string };
  };
  group: { id: string; name: string } | null;
  academicYear: { name: string } | null;
  program: { name: string } | null;
  subject: { name: string } | null;
};

type EnrollmentsResponse = {
  enrollments: Enrollment[];
  pagination: { page: number; totalPages: number; total: number };
};

function EnrollmentsListInner() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const { data, loading, error } = useFetch<EnrollmentsResponse>(
    `/api/enrollments?${params.toString()}`
  );

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <EmptyState
        icon={<ClipboardCheck className="h-7 w-7" />}
        title="Failed to load enrollments"
        description={error}
        action={
          <button onClick={() => window.location.reload()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Retry
          </button>
        }
      />
    );
  }

  const enrollments = data?.enrollments ?? [];
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search enrollments..." />
        </div>
        <FilterBar
          filters={[
            {
              key: "status",
              label: "All Statuses",
              options: [
                { value: "ACTIVE", label: "Active" },
                { value: "COMPLETED", label: "Completed" },
                { value: "WITHDRAWN", label: "Withdrawn" },
                { value: "TRANSFERRED", label: "Transferred" },
                { value: "REPEATING", label: "Repeating" },
              ],
            },
          ]}
        />
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="h-7 w-7" />}
          title="No enrollments"
          description="Enroll a student to get started."
          action={
            <button onClick={() => startTransition(() => router.push("/enrollments/new"))} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              + New Enrollment
            </button>
          }
        />
      ) : (
        <>
          <DataTable
            columns={[
              {
                key: "student",
                header: "Student",
                render: (e: Enrollment) => (
                  <span className="font-medium">
                    {e.student.person.firstName} {e.student.person.lastName}
                  </span>
                ),
              },
              { key: "group", header: "Group", render: (e: Enrollment) => e.group?.name ?? "—" },
              { key: "academicYear", header: "Year", render: (e: Enrollment) => e.academicYear?.name ?? "—" },
              { key: "program", header: "Program", render: (e: Enrollment) => e.program?.name ?? "—" },
              {
                key: "startDate",
                header: "Start",
                render: (e: Enrollment) => new Date(e.startDate).toLocaleDateString(),
              },
              {
                key: "status",
                header: "Status",
                render: (e: Enrollment) => <StatusBadge status={e.status} />,
              },
            ]}
            data={enrollments}
            onRowClick={(e) => startTransition(() => router.push(`/enrollments/${e.id}`))}
          />
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

export function EnrollmentsList() {
  return (
    <Suspense fallback={<LoadingState />}>
      <EnrollmentsListInner />
    </Suspense>
  );
}
