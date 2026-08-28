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

type Trainer = {
  id: string;
  specialization: string | null;
  hourlyRate: number | null;
  employmentType: string | null;
  status: string;
  staff: {
    person: { firstName: string; lastName: string; email: string; phone: string | null };
  };
};

function TrainersListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch("/api/trainers?" + params.toString(), { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setTrainers(data.trainers ?? []);
        setPagination(data.pagination ?? { page: 1, totalPages: 1, total: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [searchParams]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Trainers</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search trainers..." />
        </div>
        <FilterBar
          filters={[
            {
              key: "status",
              label: "All Statuses",
              options: [
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ],
            },
          ]}
        />
      </div>

      {trainers.length === 0 ? (
        <EmptyState title="No trainers found" description="Trainers appear here once added to the system." />
      ) : (
        <>
          <DataTable
            columns={[
              { key: "name", header: "Name", render: (t: Trainer) => <span className="font-medium">{t.staff.person.firstName} {t.staff.person.lastName}</span> },
              { key: "email", header: "Email", render: (t: Trainer) => t.staff.person.email },
              { key: "specialization", header: "Specialization", render: (t: Trainer) => t.specialization ?? "—" },
              { key: "employmentType", header: "Type", render: (t: Trainer) => t.employmentType ?? "—" },
              { key: "hourlyRate", header: "Hourly Rate", render: (t: Trainer) => t.hourlyRate ? Number(t.hourlyRate).toLocaleString() + " DA" : "—" },
              { key: "status", header: "Status", render: (t: Trainer) => <StatusBadge status={t.status} /> },
            ]}
            data={trainers}
          />
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

export default function TrainersPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <TrainersListInner />
      </Suspense>
    </div>
  );
}
