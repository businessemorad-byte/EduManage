"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import { SearchInput } from "@/components/ui/search-input";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Bell, CheckCheck, Archive, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  category: string | null;
  read: boolean;
  archived: boolean;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
};

const TYPE_ICONS: Record<string, typeof Info> = {
  INFO: Info,
  WARNING: AlertTriangle,
  SUCCESS: CheckCircle,
  ERROR: XCircle,
};

const CATEGORY_COLORS: Record<string, string> = {
  attendance: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  finance: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  academic: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  system: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  automation: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  communication: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  billing: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  training: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

function InboxInner() {
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/communication/inbox?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setPagination({ page: data.page ?? 1, totalPages: data.totalPages ?? 1, total: data.total ?? 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [searchParams]);

  const markRead = async (id: string) => {
    await fetch("/api/communication/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", notificationId: id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const archiveItem = async (id: string) => {
    await fetch("/api/communication/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive", notificationId: id }),
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllRead = async () => {
    await fetch("/api/communication/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-zinc-500" />
          <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
          {notifications.some((n) => !n.read) && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {notifications.filter((n) => !n.read).length} unread
            </span>
          )}
        </div>
        <button
          onClick={() => startTransition(markAllRead)}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <CheckCheck className="h-4 w-4" /> Mark All Read
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search notifications..." />
        </div>
        <FilterBar
          filters={[
            {
              key: "category",
              label: "All Categories",
              options: [
                { value: "attendance", label: "Attendance" },
                { value: "finance", label: "Finance" },
                { value: "academic", label: "Academic" },
                { value: "system", label: "System" },
                { value: "automation", label: "Automation" },
                { value: "communication", label: "Communication" },
                { value: "billing", label: "Billing" },
                { value: "training", label: "Training" },
              ],
            },
            {
              key: "read",
              label: "All",
              options: [
                { value: "false", label: "Unread" },
                { value: "true", label: "Read" },
              ],
            },
          ]}
        />
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="Your inbox is empty. Notifications from across the platform will appear here." />
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = TYPE_ICONS[n.type] ?? Info;
              return (
                <div
                  key={n.id}
                  className={`flex items-start justify-between rounded-lg border px-4 py-3 transition-colors ${
                    n.read
                      ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                      : "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20"
                  }`}
                >
                  <div className="flex gap-3 min-w-0 flex-1">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      n.type === "ERROR" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      : n.type === "WARNING" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                      : n.type === "SUCCESS" ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                        <h3 className="text-sm font-medium">{n.title}</h3>
                        {n.category && (
                          <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[n.category] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                            {n.category}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{n.body}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                        {n.referenceType && <span className="text-zinc-400">· {n.referenceType}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-1">
                    {!n.read && (
                      <button onClick={() => markRead(n.id)} className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950">Mark read</button>
                    )}
                    <button onClick={() => archiveItem(n.id)} className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800" title="Archive">
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} />
        </>
      )}
    </div>
  );
}

export default function InboxPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <InboxInner />
      </Suspense>
    </div>
  );
}
