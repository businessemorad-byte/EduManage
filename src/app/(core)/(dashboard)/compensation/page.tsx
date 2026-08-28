"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

type Compensation = {
  id: string;
  teacher: { user: { name: string } };
  month: number;
  year: number;
  totalHours: number;
  hourlyRate: number;
  amount: number;
  status: string;
};

function CompensationListInner() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Compensation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/compensation?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setItems(data.compensations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [searchParams]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Teacher Compensation</h1>
      {items.length === 0 ? (
        <EmptyState title="No compensation records found" description="Compensation is auto-generated from class sessions." />
      ) : (
        <DataTable
          columns={[
            { key: "teacher", header: "Teacher", render: (c: Compensation) => <span className="font-medium">{c.teacher.user.name}</span> },
            { key: "period", header: "Period", render: (c: Compensation) => `${c.month}/${c.year}` },
            { key: "hours", header: "Hours", render: (c: Compensation) => c.totalHours.toFixed(1) },
            { key: "rate", header: "Rate", render: (c: Compensation) => `${Number(c.hourlyRate).toFixed(2)} DA/hr` },
            { key: "amount", header: "Amount", render: (c: Compensation) => <span className="font-bold">{Number(c.amount).toLocaleString()} DA</span> },
            { key: "status", header: "Status", render: (c: Compensation) => <StatusBadge status={c.status} /> },
          ]}
          data={items}
        />
      )}
    </div>
  );
}

export default function CompensationPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <CompensationListInner />
      </Suspense>
    </div>
  );
}
