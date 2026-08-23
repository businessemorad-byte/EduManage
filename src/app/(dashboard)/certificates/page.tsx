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

type Certificate = {
  id: string;
  certificateNumber: string;
  student: { user: { name: string } };
  program: { name: string } | null;
  cohort: { name: string } | null;
  finalScore: number | null;
  status: string;
  issuedAt: string;
  expirationDate: string | null;
};

function CertificatesListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/certificates?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setCertificates(data.certificates ?? []);
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
        <h1 className="text-2xl font-bold tracking-tight">Certificates</h1>
        <button
          onClick={() => startTransition(() => router.push("/certificates/new"))}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Issue Certificate
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search certificates..." />
        </div>
        <FilterBar
          filters={[
            {
              key: "status",
              label: "All Statuses",
              options: [
                { value: "ACTIVE", label: "Active" },
                { value: "REVOKED", label: "Revoked" },
                { value: "EXPIRED", label: "Expired" },
              ],
            },
          ]}
        />
      </div>

      {certificates.length === 0 ? (
        <EmptyState title="No certificates found" description="Issue your first certificate to get started." />
      ) : (
        <>
          <DataTable
            columns={[
              { key: "number", header: "Number", render: (c: Certificate) => <span className="font-medium font-mono">{c.certificateNumber}</span> },
              { key: "student", header: "Student", render: (c: Certificate) => c.student.user.name },
              { key: "program", header: "Program", render: (c: Certificate) => c.program?.name ?? "—" },
              { key: "score", header: "Score", render: (c: Certificate) => c.finalScore != null ? `${c.finalScore}%` : "—" },
              { key: "issuedAt", header: "Issued", render: (c: Certificate) => new Date(c.issuedAt).toLocaleDateString() },
              { key: "expires", header: "Expires", render: (c: Certificate) => c.expirationDate ? new Date(c.expirationDate).toLocaleDateString() : "Never" },
              { key: "status", header: "Status", render: (c: Certificate) => <StatusBadge status={c.status} /> },
            ]}
            data={certificates}
            onRowClick={(item) => startTransition(() => router.push(`/certificates/${item.id}`))}
          />
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

export default function CertificatesPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <CertificatesListInner />
      </Suspense>
    </div>
  );
}
