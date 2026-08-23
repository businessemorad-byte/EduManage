"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft, Award, Hash, BookOpen, FileText } from "lucide-react";

type Subject = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  weeklyHours: number | null;
  level: { id: string; name: string } | null;
  academicYear: { id: string; name: string } | null;
};

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/subjects/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setSubject(data.subject))
      .catch(() => setError("Subject not found"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingState />;

  if (error || !subject) {
    return (
      <div className="animate-fade-in space-y-4">
        <PageHeader
          title="Subject"
          description="View subject details."
          icon={<BookOpen className="h-5 w-5" />}
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
        title={subject.name}
        description="Subject details"
        icon={<BookOpen className="h-5 w-5" />}
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
                <BookOpen className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Name</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{subject.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Hash className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Code</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{subject.code}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm sm:col-span-2">
                <FileText className="mt-0.5 h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Description</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{subject.description || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Award className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Weekly Hours</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{subject.weeklyHours ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Award className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Level</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{subject.level?.name ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Hash className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Academic Year</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{subject.academicYear?.name ?? "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Status</h3>
            <StatusBadge status={subject.isActive ? "ACTIVE" : "INACTIVE"} />
            <div className="mt-4 space-y-2 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                {subject.weeklyHours ? `${subject.weeklyHours} hours per week` : "No weekly hours set"}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => router.push(`/assessments?subjectId=${subject.id}`)} className="flex w-full items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400">
                <FileText className="h-4 w-4" /> View Assessments
              </button>
              <button onClick={() => router.push(`/homework?subjectId=${subject.id}`)} className="flex w-full items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400">
                <BookOpen className="h-4 w-4" /> View Homework
              </button>
              <button onClick={() => router.push(`/groups?subjectId=${subject.id}`)} className="flex w-full items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400">
                <Hash className="h-4 w-4" /> View Groups
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
