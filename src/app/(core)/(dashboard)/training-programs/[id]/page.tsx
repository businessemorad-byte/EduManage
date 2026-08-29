"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

type ProgramDetail = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  trainingCategory: string | null;
  duration: string | null;
  level: string | null;
  objectives: string | null;
  prerequisites: string | null;
  price: number | null;
  certificateEligibility: boolean;
  programStatus: string;
  isActive: boolean;
  createdAt: string;
  modules: Array<{ id: string; name: string; description: string | null; duration: string | null; moduleStatus: string; _count: { classSessions: number } }>;
  groups: Array<{ id: string; name: string; capacity: number | null; cohortStatus: string | null; _count: { enrollments: number } }>;
  _count: { enrollments: number; certificates: number };
};

function ProgramDetailInner() {
  const params = useParams();
  const router = useRouter();
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    fetch("/api/training-programs?search=" + encodeURIComponent(id))
      .then((r) => r.json())
      .then((data) => {
        const found = (data.programs ?? []).find((p: ProgramDetail) => p.id === id);
        setProgram(found ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingState />;
  if (!program) return <EmptyState title="Program not found" description="This program may have been deleted." />;

  const cardCls = "rounded-lg border border-zinc-200 bg-white p-5";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{program.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">{program.code ? program.code + " | " : ""}{program.trainingCategory ?? "Uncategorized"}</p>
        </div>
        <button onClick={() => router.push("/training-programs")} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
          Back to Programs
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cardCls}>
          <p className="text-xs text-zinc-500">Status</p>
          <StatusBadge status={program.programStatus ?? "ACTIVE"} />
        </div>
        <div className={cardCls}>
          <p className="text-xs text-zinc-500">Duration</p>
          <p className="text-lg font-semibold">{program.duration ?? "Not set"}</p>
        </div>
        <div className={cardCls}>
          <p className="text-xs text-zinc-500">Price</p>
          <p className="text-lg font-semibold">{program.price ? Number(program.price).toLocaleString() + " DA" : "Free"}</p>
        </div>
        <div className={cardCls}>
          <p className="text-xs text-zinc-500">Level</p>
          <p className="text-lg font-semibold">{program.level ?? "Not set"}</p>
        </div>
      </div>

      {program.description && (
        <div className={cardCls}>
          <h2 className="mb-2 text-sm font-semibold text-zinc-700">Description</h2>
          <p className="text-sm text-zinc-600">{program.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={cardCls}>
          <h2 className="mb-2 text-sm font-semibold text-zinc-700">Objectives</h2>
          <p className="text-sm text-zinc-600">{program.objectives ?? "Not set"}</p>
        </div>
        <div className={cardCls}>
          <h2 className="mb-2 text-sm font-semibold text-zinc-700">Prerequisites</h2>
          <p className="text-sm text-zinc-600">{program.prerequisites ?? "None"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={cardCls}>
          <p className="text-xs text-zinc-500">Enrollments</p>
          <p className="text-2xl font-bold text-blue-600">{program._count.enrollments}</p>
        </div>
        <div className={cardCls}>
          <p className="text-xs text-zinc-500">Cohorts</p>
          <p className="text-2xl font-bold text-emerald-600">{program.groups.length}</p>
        </div>
        <div className={cardCls}>
          <p className="text-xs text-zinc-500">Certificates</p>
          <p className="text-2xl font-bold text-amber-600">{program._count.certificates}</p>
        </div>
      </div>

      {program.modules.length > 0 && (
        <div className={cardCls}>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Modules ({program.modules.length})</h2>
          <div className="space-y-2">
            {program.modules.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3">
                <div>
                  <span className="text-sm font-medium">{m.name}</span>
                  {m.description && <span className="ml-2 text-xs text-zinc-500">{m.description}</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span>{m._count.classSessions} sessions</span>
                  <StatusBadge status={m.moduleStatus ?? "ACTIVE"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {program.groups.length > 0 && (
        <div className={cardCls}>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">Cohorts ({program.groups.length})</h2>
          <div className="space-y-2">
            {program.groups.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3">
                <span className="text-sm font-medium">{g.name}</span>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span>{g._count.enrollments}{g.capacity ? "/" + g.capacity : ""} learners</span>
                  {g.cohortStatus && <StatusBadge status={g.cohortStatus} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {program.certificateEligibility && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-700">Certificate Eligible - Learners completing this program are eligible for certificates.</p>
        </div>
      )}
    </div>
  );
}

export default function ProgramDetailPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <ProgramDetailInner />
      </Suspense>
    </div>
  );
}