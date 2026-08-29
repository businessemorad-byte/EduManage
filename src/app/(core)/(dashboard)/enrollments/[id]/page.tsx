"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft, ClipboardCheck, User, Users, Calendar, BookOpen, GraduationCap } from "lucide-react";

type Enrollment = {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  student: {
    id: string;
    person: { firstName: string; lastName: string };
  };
  group: { id: string; name: string } | null;
  academicYear: { name: string } | null;
  program: { name: string } | null;
  subject: { name: string } | null;
};

export default function EnrollmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/enrollments/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setEnrollment(data.enrollment))
      .catch(() => setError("Enrollment not found"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const studentName = enrollment ? `${enrollment.student.person.firstName} ${enrollment.student.person.lastName}` : "";

  if (loading) return <LoadingState />;

  if (error || !enrollment) {
    return (
      <div className="animate-fade-in space-y-4">
        <PageHeader
          title="Enrollment"
          description="View enrollment details."
          icon={<ClipboardCheck className="h-5 w-5" />}
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
        title={studentName}
        description="Enrollment details"
        icon={<ClipboardCheck className="h-5 w-5" />}
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
                <User className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Student</p>
                  <p className="font-medium text-zinc-900">{studentName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Group</p>
                  <p className="font-medium text-zinc-900">{enrollment.group?.name ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Academic Year</p>
                  <p className="font-medium text-zinc-900">{enrollment.academicYear?.name ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Program</p>
                  <p className="font-medium text-zinc-900">{enrollment.program?.name ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Subject</p>
                  <p className="font-medium text-zinc-900">{enrollment.subject?.name ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Start Date</p>
                  <p className="font-medium text-zinc-900">{new Date(enrollment.startDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">End Date</p>
                  <p className="font-medium text-zinc-900">{enrollment.endDate ? new Date(enrollment.endDate).toLocaleDateString() : "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Status</h3>
            <StatusBadge status={enrollment.status} />
            <div className="mt-4 space-y-2 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                {enrollment.isActive ? "Active enrollment" : "Inactive enrollment"}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => router.push(`/students/${enrollment.student.id}`)} className="flex w-full items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100">
                <User className="h-4 w-4" /> View Student Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
