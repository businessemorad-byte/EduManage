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
import { Target } from "lucide-react";

type Lead = {
  id: string;
  studentName: string;
  parentName: string | null;
  phone: string;
  source: string;
  status: string;
  branch: { name: string } | null;
  createdAt: string;
};

function LeadsListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/leads?${params.toString()}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => {
        setLeads(data.leads ?? []);
        setPagination(data.pagination ?? { page: 1, totalPages: 1, total: 0 });
      })
      .catch((e) => { if (e.name !== "AbortError") setError("Failed to load leads"); })
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
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search leads..." />
        </div>
        <FilterBar
          filters={[
            {
              key: "status",
              label: "All Statuses",
              options: [
                { value: "LEAD", label: "Lead" },
                { value: "CONTACTED", label: "Contacted" },
                { value: "INTERESTED", label: "Interested" },
                { value: "TRIAL_SCHEDULED", label: "Trial Scheduled" },
                { value: "TRIAL_ATTENDED", label: "Trial Attended" },
                { value: "ENROLLED", label: "Enrolled" },
                { value: "LOST", label: "Lost" },
              ],
            },
            {
              key: "source",
              label: "All Sources",
              options: [
                { value: "REFERRAL", label: "Referral" },
                { value: "SOCIAL_MEDIA", label: "Social Media" },
                { value: "WEBSITE", label: "Website" },
                { value: "WALK_IN", label: "Walk-in" },
                { value: "PHONE_CALL", label: "Phone Call" },
                { value: "SMS", label: "SMS" },
                { value: "ADVERTISEMENT", label: "Advertisement" },
                { value: "OTHER", label: "Other" },
              ],
            },
          ]}
        />
      </div>

      {leads.length === 0 ? (
        <EmptyState title="No leads found" description="Capture your first lead to get started." />
      ) : (
        <>
          <DataTable
            columns={[
              { key: "studentName", header: "Student Name", render: (l: Lead) => <span className="font-medium">{l.studentName}</span> },
              { key: "parentName", header: "Parent", render: (l: Lead) => l.parentName ?? "—" },
              { key: "phone", header: "Phone", render: (l: Lead) => l.phone },
              { key: "source", header: "Source", render: (l: Lead) => l.source },
              { key: "status", header: "Status", render: (l: Lead) => <StatusBadge status={l.status} /> },
              { key: "branch", header: "Branch", render: (l: Lead) => l.branch?.name ?? "—" },
              { key: "createdAt", header: "Created", render: (l: Lead) => new Date(l.createdAt).toLocaleDateString() },
            ]}
            data={leads}
            onRowClick={(item) => startTransition(() => router.push(`/leads/${item.id}`))}
          />
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

export default function LeadsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Leads"
        description="Track prospects and manage the enrollment pipeline."
        icon={<Target className="h-5 w-5" />}
      />
      <Suspense fallback={<LoadingState />}>
        <LeadsListInner />
      </Suspense>
    </div>
  );
}
