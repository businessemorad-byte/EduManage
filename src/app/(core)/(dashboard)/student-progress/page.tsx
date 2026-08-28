"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { TrendingUp } from "lucide-react";

type ProgressNote = {
  id: string;
  student: { id: string; user: { name: string } };
  teacher: { user: { name: string } } | null;
  subject: { id: string; name: string } | null;
  category: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
};

type ProgressResponse = {
  notes: ProgressNote[];
  pagination?: { page: number; totalPages: number; total: number };
};

function StudentProgressListInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const { data, loading, error } = useFetch<ProgressResponse>(
    `/api/student-progress?${params.toString()}`
  );

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-7 w-7" />}
        title="Failed to load progress notes"
        description={error}
        action={
          <button onClick={() => window.location.reload()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Retry
          </button>
        }
      />
    );
  }

  const notes = data?.notes ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search progress notes..." />
        </div>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="h-7 w-7" />}
          title="No progress notes found"
          description="Add a progress note from a student's profile."
        />
      ) : (
        <DataTable
          columns={[
            { key: "student", header: "Student", render: (n: ProgressNote) => <span className="font-medium">{n.student.user.name}</span> },
            { key: "teacher", header: "Teacher", render: (n: ProgressNote) => n.teacher?.user.name ?? "—" },
            { key: "subject", header: "Subject", render: (n: ProgressNote) => n.subject?.name ?? "—" },
            { key: "category", header: "Category", render: (n: ProgressNote) => <StatusBadge status={n.category} /> },
            { key: "content", header: "Note", render: (n: ProgressNote) => <span className="max-w-xs truncate block">{n.content}</span> },
            { key: "date", header: "Date", render: (n: ProgressNote) => new Date(n.createdAt).toLocaleDateString() },
          ]}
          data={notes}
        />
      )}
    </div>
  );
}

export default function StudentProgressPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Student Progress Notes</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">View academic progress and teacher feedback for students.</p>
      </div>
      <Suspense fallback={<LoadingState />}>
        <StudentProgressListInner />
      </Suspense>
    </div>
  );
}
