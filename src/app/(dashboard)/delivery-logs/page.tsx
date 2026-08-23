"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

type Log = {
  id: string;
  channel: string;
  recipientType: string;
  recipientId: string | null;
  subject: string | null;
  content: string;
  status: string;
  provider: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
};

function DeliveryLogsInner() {
  const searchParams = useSearchParams();
  const [logs, setLogs] = useState<Log[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/communication/delivery-logs?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs ?? []);
        setPagination({ page: data.page ?? 1, totalPages: data.totalPages ?? 1, total: data.total ?? 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [searchParams]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Delivery Logs</h1>

      <div className="flex flex-wrap items-center gap-3">
        <FilterBar
          filters={[
            {
              key: "channel",
              label: "All Channels",
              options: [
                { value: "EMAIL", label: "Email" },
                { value: "SMS", label: "SMS" },
                { value: "WHATSAPP", label: "WhatsApp" },
                { value: "IN_APP", label: "In-App" },
              ],
            },
            {
              key: "status",
              label: "All Statuses",
              options: [
                { value: "QUEUED", label: "Queued" },
                { value: "SENDING", label: "Sending" },
                { value: "SENT", label: "Sent" },
                { value: "DELIVERED", label: "Delivered" },
                { value: "FAILED", label: "Failed" },
              ],
            },
          ]}
        />
      </div>

      {logs.length === 0 ? (
        <EmptyState title="No delivery logs" description="Messages sent will appear here." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">Channel</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">Recipient</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">Subject</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">Provider</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">Retries</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">{log.channel}</span>
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{log.recipientType}</td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400 max-w-[200px] truncate">{log.subject ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.status === "DELIVERED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : log.status === "FAILED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : log.status === "SENT" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}>{log.status}</span>
                    </td>
                    <td className="px-4 py-2 text-xs text-zinc-500">{log.provider ?? "—"}</td>
                    <td className="px-4 py-2 text-xs text-zinc-500">{log.retryCount}</td>
                    <td className="px-4 py-2 text-xs text-zinc-500">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} />
        </>
      )}
    </div>
  );
}

export default function DeliveryLogsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DeliveryLogsInner />
    </Suspense>
  );
}
