"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";

type Campaign = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  scheduledAt: string | null;
  createdAt: string;
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/communication/campaigns")
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(data.campaigns ?? []);
        setPagination({ page: data.page ?? 1, totalPages: data.totalPages ?? 1, total: data.total ?? 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
        <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Create Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState title="No campaigns" description="Create your first communication campaign." />
      ) : (
        <>
          <div className="space-y-3">
            {campaigns.map((c) => (
              <div key={c.id} className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">{c.name}</h3>
                    {c.description && <p className="mt-1 text-sm text-zinc-500">{c.description}</p>}
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    c.status === "RUNNING" ? "bg-green-100 text-green-700"
                    : c.status === "COMPLETED" ? "bg-blue-100 text-blue-700"
                    : c.status === "FAILED" ? "bg-red-100 text-red-700"
                    : "bg-zinc-100 text-zinc-700"
                  }`}>{c.status}</span>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-zinc-500">
                  <span>Recipients: {c.recipientCount}</span>
                  <span>Sent: {c.sentCount}</span>
                  <span>Delivered: {c.deliveredCount}</span>
                  <span>Failed: {c.failedCount}</span>
                  {c.scheduledAt && <span>Scheduled: {new Date(c.scheduledAt).toLocaleString()}</span>}
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
