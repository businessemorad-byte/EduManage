"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft, Users, BookOpen, Calendar, Hash, GraduationCap, UserCheck, MapPin } from "lucide-react";

type Group = {
  id: string;
  name: string;
  code: string;
  capacity: number;
  isActive: boolean;
  academicYear: { id: string; name: string } | null;
  level: { id: string; name: string } | null;
  program: { id: string; name: string } | null;
  teacher: { id: string; person: { firstName: string; lastName: string } } | null;
  enrollments: Array<{ id: string; student: { person: { firstName: string; lastName: string } } }>;
  _count: { enrollments: number; schedules: number; assessments: number; homework: number };
};

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/groups/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setGroup(data.group))
      .catch(() => setError("Group not found"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingState />;

  if (error || !group) {
    return (
      <div className="animate-fade-in space-y-4">
        <PageHeader
          title="Group"
          description="View group details."
          icon={<Users className="h-5 w-5" />}
        />
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
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
        title={group.name}
        description={`Group ${group.code}`}
        icon={<Users className="h-5 w-5" />}
        action={
          <button onClick={() => router.back()} className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Name</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{group.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Hash className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Code</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{group.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <UserCheck className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Capacity</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{group.capacity}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Academic Year</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{group.academicYear?.name ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Level</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{group.level?.name ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Program</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{group.program?.name ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Teacher</p>
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {group.teacher ? `${group.teacher.person.firstName} ${group.teacher.person.lastName}` : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Enrolled Students</h3>
            {group.enrollments.length === 0 ? (
              <p className="text-sm text-zinc-500">No students enrolled yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {group.enrollments.map((enrollment) => (
                  <li key={enrollment.id} className="flex items-center gap-3 py-3 text-sm">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                      {enrollment.student.person.firstName.charAt(0)}
                      {enrollment.student.person.lastName.charAt(0)}
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {enrollment.student.person.firstName} {enrollment.student.person.lastName}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Status</h3>
            <StatusBadge status={group.isActive ? "ACTIVE" : "INACTIVE"} />
            <div className="mt-4 space-y-2 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {group._count.enrollments} / {group.capacity} students
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Linked Data</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => router.push(`/timetable?groupId=${group.id}`)} className="flex items-center gap-2 rounded-lg border border-zinc-100 p-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xs text-zinc-500">Schedules</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{group._count.schedules}</p>
                </div>
              </button>
              <button onClick={() => router.push(`/assessments?groupId=${group.id}`)} className="flex items-center gap-2 rounded-lg border border-zinc-100 p-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                <GraduationCap className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-xs text-zinc-500">Assessments</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{group._count.assessments}</p>
                </div>
              </button>
              <button onClick={() => router.push(`/homework?groupId=${group.id}`)} className="flex items-center gap-2 rounded-lg border border-zinc-100 p-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                <BookOpen className="h-5 w-5 text-rose-500" />
                <div>
                  <p className="text-xs text-zinc-500">Homework</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{group._count.homework}</p>
                </div>
              </button>
              <button onClick={() => router.push(`/enrollments?groupId=${group.id}`)} className="flex items-center gap-2 rounded-lg border border-zinc-100 p-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                <UserCheck className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-xs text-zinc-500">Enrollments</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{group._count.enrollments}</p>
                </div>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => router.push(`/enrollments/new?groupId=${group.id}`)} className="flex w-full items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400">
                + Enroll Student
              </button>
              <button onClick={() => router.push(`/assessments/new?groupId=${group.id}`)} className="flex w-full items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400">
                + Add Assessment
              </button>
              <button onClick={() => router.push(`/homework/new?groupId=${group.id}`)} className="flex w-full items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400">
                + Assign Homework
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
