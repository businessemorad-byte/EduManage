"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft, CalendarDays, Calendar, Hash, BookOpen, Users, ClipboardCheck } from "lucide-react";

type AcademicYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  isActive: boolean;
  _count: { levels: number; subjects: number; groups: number; enrollments: number };
};

export default function AcademicYearDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [year, setYear] = useState<AcademicYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/academic-years/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setYear(data.academicYear))
      .catch(() => setError("Academic year not found"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingState />;

  if (error || !year) {
    return (
      <div className="animate-fade-in space-y-4">
        <PageHeader
          title="Academic Year"
          description="View academic year details."
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
          <p className="text-sm text-zinc-500">{error || "Not found"}</p>
          <button onClick={() => router.back()} className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={year.name}
        description="Academic year details"
        icon={<CalendarDays className="h-5 w-5" />}
        action={
          <button onClick={() => router.back()} className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-sm">
                <CalendarDays className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Name</p>
                  <p className="font-medium text-zinc-900">{year.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Start Date</p>
                  <p className="font-medium text-zinc-900">{new Date(year.startDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">End Date</p>
                  <p className="font-medium text-zinc-900">{year.endDate ? new Date(year.endDate).toLocaleDateString() : "—"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Linked Data</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button onClick={() => router.push(`/levels?academicYearId=${year.id}`)} className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 text-left hover:bg-zinc-50">
                <BookOpen className="h-5 w-5 text-brand-500" />
                <div>
                  <p className="text-xs text-zinc-500">Levels</p>
                  <p className="text-lg font-bold text-zinc-900">{year._count.levels}</p>
                </div>
              </button>
              <button onClick={() => router.push(`/subjects?academicYearId=${year.id}`)} className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 text-left hover:bg-zinc-50">
                <Hash className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-xs text-zinc-500">Subjects</p>
                  <p className="text-lg font-bold text-zinc-900">{year._count.subjects}</p>
                </div>
              </button>
              <button onClick={() => router.push(`/groups?academicYearId=${year.id}`)} className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 text-left hover:bg-zinc-50">
                <Users className="h-5 w-5 text-rose-500" />
                <div>
                  <p className="text-xs text-zinc-500">Groups</p>
                  <p className="text-lg font-bold text-zinc-900">{year._count.groups}</p>
                </div>
              </button>
              <button onClick={() => router.push(`/enrollments?academicYearId=${year.id}`)} className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 text-left hover:bg-zinc-50">
                <ClipboardCheck className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-xs text-zinc-500">Enrollments</p>
                  <p className="text-lg font-bold text-zinc-900">{year._count.enrollments}</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Status</h3>
            <StatusBadge status={year.isCurrent ? "ACTIVE" : "INACTIVE"} />
            <div className="mt-4 space-y-2 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {year.isCurrent ? "Current year" : "Not current"}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => router.push(`/levels/new?academicYearId=${year.id}`)} className="flex w-full items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100">
                + Add Level
              </button>
              <button onClick={() => router.push(`/subjects/new?academicYearId=${year.id}`)} className="flex w-full items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100">
                + Add Subject
              </button>
              <button onClick={() => router.push(`/groups/new?academicYearId=${year.id}`)} className="flex w-full items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100">
                + Add Group
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
