"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

type Trainee = {
  id: string;
  enrollmentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  programName: string | null;
  cohortName: string | null;
  enrollmentStatus: string;
  enrolledAt: string;
  attendanceRate: number | null;
};

function TraineesListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch("/api/training-enrollments?" + params.toString(), { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const items = (data.enrollments ?? []).map((e: Record<string, unknown>) => ({
          id: (e.student as Record<string, unknown>)?.id ?? e.studentId,
          enrollmentId: e.id,
          firstName: ((e.student as Record<string, unknown>)?.person as Record<string, unknown>)?.firstName ?? "",
          lastName: ((e.student as Record<string, unknown>)?.person as Record<string, unknown>)?.lastName ?? "",
          email: ((e.student as Record<string, unknown>)?.person as Record<string, unknown>)?.email ?? "",
          phone: ((e.student as Record<string, unknown>)?.person as Record<string, unknown>)?.phone ?? null,
          programName: (e.program as Record<string, unknown>)?.name ?? null,
          cohortName: (e.group as Record<string, unknown>)?.name ?? null,
          enrollmentStatus: e.status as string,
          enrolledAt: e.createdAt as string,
          attendanceRate: null,
        }));
        setTrainees(items);
        setPagination(data.pagination ?? { page: 1, totalPages: 1, total: data.total ?? 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [searchParams]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trainees</h1>
          <p className="mt-1 text-sm text-zinc-500">Training center learners enrolled in programs.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search trainees..." />
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
              ],
            },
          ]}
        />
      </div>

      {trainees.length === 0 ? (
        <EmptyState title="No trainees found" description="Trainees appear here once enrolled in training programs." />
      ) : (
        <>
          <DataTable
            columns={[
              { key: "name", header: "Name", render: (t: Trainee) => <span className="font-medium">{t.firstName} {t.lastName}</span> },
              { key: "email", header: "Email", render: (t: Trainee) => t.email },
              { key: "program", header: "Program", render: (t: Trainee) => t.programName ?? "—" },
              { key: "cohort", header: "Cohort", render: (t: Trainee) => t.cohortName ?? "—" },
              { key: "enrolledAt", header: "Enrolled", render: (t: Trainee) => new Date(t.enrolledAt).toLocaleDateString() },
              { key: "status", header: "Status", render: (t: Trainee) => (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  t.enrollmentStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-700" :
                  t.enrollmentStatus === "COMPLETED" ? "bg-blue-50 text-blue-700" :
                  "bg-zinc-100 text-zinc-600"
                }`}>{t.enrollmentStatus}</span>
              )},
            ]}
            data={trainees}
            onRowClick={(item) => startTransition(() => router.push("/training-progress?studentId=" + item.id))}
          />
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

export default function TraineesPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <TraineesListInner />
      </Suspense>
    </div>
  );
}
