"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

type ContactRequest = {
  id: string;
  senderName: string;
  senderEmail: string | null;
  senderPhone: string | null;
  subject: string;
  message: string;
  category: string;
  status: string;
  assignedTo: string | null;
  createdAt: string;
};

function ContactRequestsInner() {
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/communication/contact-requests?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setRequests(data.requests ?? []);
        setPagination({ page: data.page ?? 1, totalPages: data.totalPages ?? 1, total: data.total ?? 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [searchParams]);

  const resolveRequest = async (id: string) => {
    await fetch("/api/communication/contact-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve", id }),
    });
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "RESOLVED" } : r)));
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Contact Requests</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search requests..." />
        </div>
        <FilterBar
          filters={[
            {
              key: "status",
              label: "All Statuses",
              options: [
                { value: "OPEN", label: "Open" },
                { value: "IN_PROGRESS", label: "In Progress" },
                { value: "RESOLVED", label: "Resolved" },
                { value: "CLOSED", label: "Closed" },
              ],
            },
            {
              key: "category",
              label: "All Categories",
              options: [
                { value: "GENERAL", label: "General" },
                { value: "PAYMENT", label: "Payment" },
                { value: "ACADEMIC", label: "Academic" },
                { value: "TECHNICAL", label: "Technical" },
                { value: "COMPLAINT", label: "Complaint" },
              ],
            },
          ]}
        />
      </div>

      {requests.length === 0 ? (
        <EmptyState title="No contact requests" description="All caught up!" />
      ) : (
        <>
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">{r.subject}</h3>
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium">
                        {r.category}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.status === "OPEN" ? "bg-amber-100 text-amber-700"
                        : r.status === "RESOLVED" ? "bg-green-100 text-green-700"
                        : "bg-zinc-100 text-zinc-700"
                      }`}>{r.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">From: {r.senderName} {r.senderEmail && `(${r.senderEmail})`}</p>
                    <p className="mt-1 text-sm text-zinc-600 line-clamp-2">{r.message}</p>
                    <p className="mt-1 text-xs text-zinc-500">{new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                  {r.status === "OPEN" && (
                    <button
                      onClick={() => startTransition(() => resolveRequest(r.id))}
                      className="ml-4 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} />
        </>
      )}
    </div>
  );
}

export default function ContactRequestsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ContactRequestsInner />
    </Suspense>
  );
}
