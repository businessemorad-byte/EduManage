"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Timer } from "lucide-react";

type Trial = {
  id: string;
  lead: { studentName: string; phone: string };
  teacher: { user: { name: string } } | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  attended: boolean | null;
};

function TrialsListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/trials?${params.toString()}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => {
        setTrials(data.trials ?? []);
        setPagination(data.pagination ?? { page: 1, totalPages: 1, total: 0 });
      })
      .catch((e) => { if (e.name !== "AbortError") setError("Failed to load trials"); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [searchParams]);

  const handleComplete = async (id: string, attended: boolean) => {
    await fetch("/api/trials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateStatus", id, status: "COMPLETED", attended }),
    });
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    const res = await fetch(`/api/trials?${params.toString()}`);
    const data = await res.json();
    setTrials(data.trials ?? []);
    setPagination(data.pagination ?? { page: 1, totalPages: 1, total: 0 });
    setLoading(false);
  };

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search trials..." />
        </div>
        <FilterBar
          filters={[
            {
              key: "status",
              label: "All Statuses",
              options: [
                { value: "SCHEDULED", label: "Scheduled" },
                { value: "COMPLETED", label: "Completed" },
                { value: "CANCELLED", label: "Cancelled" },
                { value: "NO_SHOW", label: "No Show" },
              ],
            },
          ]}
        />
      </div>

      {trials.length === 0 ? (
        <EmptyState title="No trial sessions found" description="Schedule your first trial session." />
      ) : (
        <>
          <DataTable
            columns={[
              { key: "studentName", header: "Student", render: (t: Trial) => <span className="font-medium">{t.lead.studentName}</span> },
              { key: "phone", header: "Phone", render: (t: Trial) => t.lead.phone },
              { key: "teacher", header: "Teacher", render: (t: Trial) => t.teacher?.user.name ?? "—" },
              { key: "date", header: "Date", render: (t: Trial) => new Date(t.scheduledDate).toLocaleDateString() },
              { key: "time", header: "Time", render: (t: Trial) => `${t.startTime} — ${t.endTime}` },
              { key: "status", header: "Status", render: (t: Trial) => <StatusBadge status={t.status} /> },
            ]}
            data={trials}
            onRowClick={(item) => startTransition(() => router.push(`/trials/${item.id}`))}
          />
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

export default function TrialsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Trial Sessions"
        description="Schedule and manage trial sessions for prospects."
        icon={<Timer className="h-5 w-5" />}
      />
      <Suspense fallback={<LoadingState />}>
        <TrialsListInner />
      </Suspense>
    </div>
  );
}
