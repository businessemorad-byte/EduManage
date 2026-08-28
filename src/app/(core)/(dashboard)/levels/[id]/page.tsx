"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft, BookOpen, Hash, Users, GraduationCap } from "lucide-react";

type Level = {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
  academicYear: { id: string; name: string } | null;
  _count: { groups: number; subjects: number };
};

export default function LevelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [level, setLevel] = useState<Level | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/levels/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setLevel(data.level))
      .catch(() => setError("Level not found"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingState />;

  if (error || !level) {
    return (
      <div className="animate-fade-in space-y-4">
        <PageHeader
          title="Level"
          description="View level details."
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
        title={level.name}
        description="Level details"
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
                  <p className="font-medium text-zinc-900 dark:text-white">{level.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Hash className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Code</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{level.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Hash className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Sort Order</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{level.sortOrder}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Academic Year</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{level.academicYear ? level.academicYear.name : "—"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Linked Data</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <button onClick={() => router.push(`/groups?levelId=${level.id}`)} className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                <Users className="h-5 w-5 text-rose-500" />
                <div>
                  <p className="text-xs text-zinc-500">Groups</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{level._count.groups}</p>
                </div>
              </button>
              <button onClick={() => router.push(`/subjects?levelId=${level.id}`)} className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                <GraduationCap className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-xs text-zinc-500">Subjects</p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{level._count.subjects}</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Status</h3>
            <StatusBadge status={level.isActive ? "ACTIVE" : "INACTIVE"} />
            <div className="mt-4 space-y-2 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {level.isActive ? "Active level" : "Inactive"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
