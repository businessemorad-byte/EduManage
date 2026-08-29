"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

type CohortDetail = {
  id: string;
  name: string;
  code: string | null;
  capacity: number | null;
  cohortStatus: string | null;
  startDate: string | null;
  endDate: string | null;
  program: { id: string; name: string } | null;
  classTeacher: { staff: { person: { firstName: string; lastName: string } } } | null;
  branch: { name: string } | null;
  _count: { enrollments: number };
  enrollments: Array<{
    id: string;
    status: string;
    student: { person: { firstName: string; lastName: string; email: string | null } };
  }>;
  classSessions: Array<{
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    startDate: string | null;
  }>;
};

function CohortDetailInner() {
  const params = useParams();
  const router = useRouter();
  const [cohort, setCohort] = useState<CohortDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    fetch("/api/cohorts?search=" + encodeURIComponent(id))
      .then((r) => r.json())
      .then((data) => {
        const found = (data.cohorts ?? []).find((c: CohortDetail) => c.id === id);
        setCohort(found ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingState />;
  if (!cohort) return <EmptyState title="Cohort not found" description="This cohort may have been deleted." />;

  const cardCls = "rounded-lg border border-zinc-200 bg-white p-5";
  const enrollmentCount = cohort._count.enrollments;
  const capacityPercent = cohort.capacity ? Math.round((enrollmentCount / cohort.capacity) * 100) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{cohort.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {cohort.code ? cohort.code + " | " : ""}
            {cohort.program?.name ?? "No program"}
          </p>
        </div>
        <button onClick={() => router.push("/cohorts")} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
          Back to Cohorts
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cardCls}>
          <p className="text-xs text-zinc-500">Status</p>
          <StatusBadge status={cohort.cohortStatus ?? "ACTIVE"} />
        </div>
        <div className={cardCls}>
          <p className="text-xs text-zinc-500">Enrollment</p>
          <p className="text-lg font-semibold">
            {enrollmentCount}
            {cohort.capacity ? ` / ${cohort.capacity}` : ""}
          </p>
          {capacityPercent !== null && (
            <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100">
              <div className={`h-1.5 rounded-full ${capacityPercent >= 90 ? "bg-red-500" : capacityPercent >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(capacityPercent, 100)}%` }} />
            </div>
          )}
        </div>
        <div className={cardCls}>
          <p className="text-xs text-zinc-500">Teacher</p>
          <p className="text-lg font-semibold">{cohort.classTeacher ? cohort.classTeacher.staff.person.firstName + " " + cohort.classTeacher.staff.person.lastName : "Not assigned"}</p>
        </div>
        <div className={cardCls}>
          <p className="text-xs text-zinc-500">Dates</p>
          <p className="text-sm font-semibold">
            {cohort.startDate ? new Date(cohort.startDate).toLocaleDateString() : "TBD"}
            {" — "}
            {cohort.endDate ? new Date(cohort.endDate).toLocaleDateString() : "TBD"}
          </p>
        </div>
      </div>

      <div className={cardCls}>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Enrolled Learners ({enrollmentCount})</h2>
        {cohort.enrollments.length === 0 ? (
          <p className="text-sm text-zinc-500">No learners enrolled yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="pb-2 text-left font-medium text-zinc-500">Name</th>
                  <th className="pb-2 text-left font-medium text-zinc-500">Email</th>
                  <th className="pb-2 text-left font-medium text-zinc-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {cohort.enrollments.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 font-medium">{e.student.person.firstName} {e.student.person.lastName}</td>
                    <td className="py-2 text-zinc-500">{e.student.person.email ?? "—"}</td>
                    <td className="py-2"><StatusBadge status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {cohort.classSessions.length > 0 && (
        <div className={cardCls}>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Sessions ({cohort.classSessions.length})</h2>
          <div className="space-y-2">
            {cohort.classSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3">
                <span className="text-sm font-medium">{s.name}</span>
                <span className="text-xs text-zinc-500">{s.startTime} - {s.endTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CohortDetailPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <CohortDetailInner />
      </Suspense>
    </div>
  );
}
