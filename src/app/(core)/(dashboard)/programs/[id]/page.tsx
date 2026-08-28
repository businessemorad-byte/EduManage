"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft, FileText, Hash, BookOpen, Users, GraduationCap, ClipboardCheck } from "lucide-react";

type Program = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  duration: string | null;
  level: { id: string; name: string } | null;
  subjects: Array<{ id: string; name: string }>;
  _count: { modules: number; groups: number; enrollments: number };
};

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/programs/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setProgram(data.program))
      .catch(() => setError("Program not found"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingState />;

  if (error || !program) {
    return (
      <div className="animate-fade-in space-y-4">
        <PageHeader
          title="Program"
          description="View program details."
          icon={<GraduationCap className="h-5 w-5" />}
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
        title={program.name}
        description="Program details"
        icon={<GraduationCap className="h-5 w-5" />}
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
                <GraduationCap className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Name</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{program.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Hash className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Code</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{program.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FileText className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Description</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{program.description || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ClipboardCheck className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Duration</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{program.duration || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Level</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{program.level ? program.level.name : "—"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Subjects</h3>
            {program.subjects.length === 0 ? (
              <p className="text-sm text-zinc-500">No subjects linked to this program.</p>
            ) : (
              <ul className="space-y-2">
                {program.subjects.map((subject) => (
                  <li key={subject.id} className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 text-sm dark:border-zinc-800">
                    <BookOpen className="h-4 w-4 text-brand-500" />
                    <span className="font-medium text-zinc-900 dark:text-white">{subject.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Linked Data</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <button onClick={() => router.push(`/modules?programId=${program.id}`)} className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                <FileText className="h-5 w-5 text-brand-500" />
                <div>
                  <p className="text-xs text-zinc-500">Modules</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{program._count.modules}</p>
                </div>
              </button>
              <button onClick={() => router.push(`/groups?programId=${program.id}`)} className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                <Users className="h-5 w-5 text-rose-500" />
                <div>
                  <p className="text-xs text-zinc-500">Groups</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{program._count.groups}</p>
                </div>
              </button>
              <button onClick={() => router.push(`/enrollments?programId=${program.id}`)} className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                <ClipboardCheck className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-xs text-zinc-500">Enrollments</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{program._count.enrollments}</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Status</h3>
            <StatusBadge status={program.isActive ? "ACTIVE" : "INACTIVE"} />
            <div className="mt-4 space-y-2 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Code: {program.code}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => router.push(`/subjects/new?programId=${program.id}`)} className="flex w-full items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400">
                + Add Subject
              </button>
              <button onClick={() => router.push(`/groups/new?programId=${program.id}`)} className="flex w-full items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400">
                + Add Group
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
