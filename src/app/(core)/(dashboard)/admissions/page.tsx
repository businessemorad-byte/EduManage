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
import { ClipboardCheck } from "lucide-react";

type Admission = {
  id: string;
  applicantName: string;
  applicantEmail: string | null;
  status: string;
  createdAt: string;
  academicYear: { name: string } | null;
  desiredLevel: { name: string } | null;
};

function AdmissionsListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/admissions?${params.toString()}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => {
        setAdmissions(data.admissions ?? []);
        setPagination(data.pagination ?? { page: 1, totalPages: 1, total: 0 });
      })
      .catch((e) => { if (e.name !== "AbortError") setError("Failed to load admissions"); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [searchParams]);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-72">
            <SearchInput placeholder="Search admissions..." />
          </div>
          <FilterBar
            filters={[
              {
                key: "status",
                label: "All Statuses",
                options: [
                  { value: "PENDING", label: "Pending" },
                  { value: "UNDER_REVIEW", label: "Under Review" },
                  { value: "ACCEPTED", label: "Accepted" },
                  { value: "REJECTED", label: "Rejected" },
                  { value: "WAITLISTED", label: "Waitlisted" },
                  { value: "WITHDRAWN", label: "Withdrawn" },
                ],
              },
            ]}
          />
        </div>
      </div>

      {admissions.length === 0 ? (
        <EmptyState
          title="No admission applications"
          description="No applications have been submitted yet."
          icon={<ClipboardCheck className="h-7 w-7" />}
        />
      ) : (
        <>
          <DataTable
            columns={[
              {
                key: "applicantName",
                header: "Applicant",
                render: (a: Admission) => (
                  <span className="font-medium text-zinc-900">{a.applicantName}</span>
                ),
              },
              {
                key: "email",
                header: "Email",
                render: (a: Admission) => a.applicantEmail ?? "—",
              },
              {
                key: "academicYear",
                header: "Academic Year",
                render: (a: Admission) => a.academicYear?.name ?? "—",
              },
              {
                key: "desiredLevel",
                header: "Level",
                render: (a: Admission) => a.desiredLevel?.name ?? "—",
              },
              {
                key: "status",
                header: "Status",
                render: (a: Admission) => <StatusBadge status={a.status} />,
              },
              {
                key: "date",
                header: "Applied",
                render: (a: Admission) => new Date(a.createdAt).toLocaleDateString(),
              },
            ]}
            data={admissions}
            onRowClick={(item) => startTransition(() => router.push(`/admissions/${item.id}`))}
          />
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

export default function AdmissionsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Admissions"
        description="Review and process admission applications."
        icon={<ClipboardCheck className="h-5 w-5" />}
      />
      <Suspense fallback={<LoadingState />}>
        <AdmissionsListInner />
      </Suspense>
    </div>
  );
}
