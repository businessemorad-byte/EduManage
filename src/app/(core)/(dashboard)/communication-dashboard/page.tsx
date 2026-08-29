"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Megaphone, MessageSquare, Send, FileOutput, Settings, Phone } from "lucide-react";

type DashboardData = {
  deliveryStats: { total: number; sent: number; delivered: number; failed: number };
  activeCampaigns: number;
  recentLogs: { id: string; channel: string; status: string; createdAt: string; recipientType: string }[];
  templates: number;
  openContactRequests: number;
  announcementStats?: { total: number; published: number; draft: number };
  unreadMessages?: number;
};

export default function CommunicationDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/communication/dashboard").then((r) => r.json()),
      fetch("/api/announcements?limit=1").then((r) => r.json()),
      fetch("/api/communication/messages?action=unread_count").then((r) => r.json()),
    ])
      .then(([dash, annData, msgData]) => {
        setData({
          ...dash,
          announcementStats: annData.pagination ? { total: annData.pagination.total, published: 0, draft: 0 } : undefined,
          unreadMessages: msgData.count ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (!data) return <div className="text-sm text-zinc-500">Failed to load dashboard.</div>;

  const stats = [
    { label: "Total Sent", value: data.deliveryStats.total, color: "text-zinc-900" },
    { label: "Delivered", value: data.deliveryStats.delivered, color: "text-green-600" },
    { label: "Failed", value: data.deliveryStats.failed, color: "text-red-600" },
    { label: "Active Campaigns", value: data.activeCampaigns, color: "text-blue-600" },
    { label: "Templates", value: data.templates, color: "text-purple-600" },
    { label: "Open Requests", value: data.openContactRequests, color: "text-amber-600" },
    { label: "Unread Messages", value: data.unreadMessages ?? 0, color: "text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Communication Center</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/announcements/new" className="rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50">
          <div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-violet-500" /><h3 className="font-semibold">New Announcement</h3></div>
          <p className="mt-1 text-sm text-zinc-500">Broadcast to organization</p>
        </Link>
        <Link href="/messages" className="rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50">
          <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-blue-500" /><h3 className="font-semibold">Messages</h3></div>
          <p className="mt-1 text-sm text-zinc-500">Inbox & compose</p>
        </Link>
        <Link href="/templates" className="rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50">
          <div className="flex items-center gap-2"><FileOutput className="h-4 w-4 text-purple-500" /><h3 className="font-semibold">Templates</h3></div>
          <p className="mt-1 text-sm text-zinc-500">Manage message templates</p>
        </Link>
        <Link href="/campaigns" className="rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50">
          <div className="flex items-center gap-2"><Send className="h-4 w-4 text-emerald-500" /><h3 className="font-semibold">Campaigns</h3></div>
          <p className="mt-1 text-sm text-zinc-500">Create & track campaigns</p>
        </Link>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Activity</h2>
        {data.recentLogs.length === 0 ? (
          <p className="text-sm text-zinc-500">No recent activity.</p>
        ) : (
          <div className="space-y-2">
            {data.recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium">{log.channel}</span>
                  <span className="text-sm text-zinc-600">{log.recipientType}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    log.status === "DELIVERED" ? "bg-green-100 text-green-700"
                    : log.status === "FAILED" ? "bg-red-100 text-red-700"
                    : "bg-zinc-100 text-zinc-700"
                  }`}>{log.status}</span>
                  <span className="text-xs text-zinc-500">{new Date(log.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
