"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

type LearnerProgress = {
  student: { id: string; user: { name: string } };
  enrollments: Array<{
    id: string;
    group: { name: string; program: { name: string } };
    status: string;
  }>;
  attendanceSummary: { total: number; present: number; rate: number };
  gradesSummary: { average: number; count: number };
  certificates: Array<{ id: string; certificateNumber: string; program: { name: string } | null; status: string }>;
  competencies: Array<{ competency: { name: string }; status: string; score: number | null }>;
};

function TrainingProgressInner() {
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState<LearnerProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const studentId = searchParams.get("studentId") ?? "";

  useEffect(() => {
    if (!studentId) return;
    const controller = new AbortController();
    fetch(`/api/training-progress?studentId=${studentId}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setProgress(data))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [studentId]);

  if (!studentId) return <EmptyState title="Select a learner" description="Provide a studentId query parameter to view training progress." />;
  if (loading) return <LoadingState />;
  if (!progress) return <EmptyState title="No progress data" description="No training data found for this learner." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Learner Progress — {progress.student.user.name}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Enrollments", value: progress.enrollments.length },
          { label: "Attendance Rate", value: `${progress.attendanceSummary.rate.toFixed(1)}%` },
          { label: "Average Grade", value: progress.gradesSummary.count > 0 ? `${progress.gradesSummary.average.toFixed(1)}%` : "—" },
          { label: "Certificates", value: progress.certificates.length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">{stat.label}</p>
            <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {progress.enrollments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Enrollments</h2>
          <div className="space-y-2">
            {progress.enrollments.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3">
                <div>
                  <p className="font-medium">{e.group.name}</p>
                  <p className="text-sm text-zinc-500">{e.group.program.name}</p>
                </div>
                <StatusBadge status={e.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {progress.certificates.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Certificates</h2>
          <div className="space-y-2">
            {progress.certificates.map((cert) => (
              <div key={cert.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3">
                <span className="font-mono text-sm">{cert.certificateNumber}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-500">{cert.program?.name ?? "—"}</span>
                  <StatusBadge status={cert.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {progress.competencies.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Competencies</h2>
          <div className="space-y-2">
            {progress.competencies.map((comp, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3">
                <span className="font-medium">{comp.competency.name}</span>
                <div className="flex items-center gap-3">
                  {comp.score != null && <span className="text-sm text-zinc-500">{comp.score}%</span>}
                  <StatusBadge status={comp.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrainingProgressPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <TrainingProgressInner />
      </Suspense>
    </div>
  );
}
