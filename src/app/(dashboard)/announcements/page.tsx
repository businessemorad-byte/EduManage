"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SearchInput } from "@/components/ui/search-input";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Megaphone, Plus, Pencil, Archive, Trash2, Send } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  content: string;
  audience: string;
  status: string;
  publishedAt: string | null;
  expiresAt: string | null;
  branch: { name: string } | null;
  group: { name: string } | null;
  createdAt: string;
};

const AUDIENCE_LABELS: Record<string, string> = {
  ALL_STUDENTS: "All Students",
  ALL_PARENTS: "All Parents",
  ALL_TEACHERS: "All Teachers",
  ALL_STAFF: "All Staff",
  SPECIFIC_CLASS: "Specific Class",
  SPECIFIC_BRANCH: "Specific Branch",
};

function AnnouncementsInner() {
  const searchParams = useSearchParams();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    fetch(`/api/announcements?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setAnnouncements(data.announcements ?? []);
        setPagination({ page: data.pagination?.page ?? 1, totalPages: data.pagination?.totalPages ?? 1, total: data.pagination?.total ?? 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [searchParams]);

  const publish = async (id: string) => {
    await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish", id }),
    });
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, status: "PUBLISHED", publishedAt: new Date().toISOString() } : a)));
  };

  const archive = async (id: string) => {
    await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive", id }),
    });
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, status: "ARCHIVED" } : a)));
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this announcement?")) return;
    await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="h-5 w-5 text-zinc-500" />
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
        </div>
        <Link href="/announcements/new" className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900">
          <Plus className="h-4 w-4" /> New Announcement
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput placeholder="Search announcements..." />
        </div>
        <FilterBar
          filters={[
            { key: "status", label: "All Statuses", options: [
              { value: "DRAFT", label: "Draft" },
              { value: "PUBLISHED", label: "Published" },
              { value: "ARCHIVED", label: "Archived" },
            ]},
            { key: "audience", label: "All Audiences", options: Object.entries(AUDIENCE_LABELS).map(([v, l]) => ({ value: v, label: l })) },
          ]}
        />
      </div>

      {announcements.length === 0 ? (
        <EmptyState title="No announcements" description="Create your first announcement to communicate with your organization." />
      ) : (
        <>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-lg border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{a.title}</h3>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.status === "PUBLISHED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : a.status === "ARCHIVED" ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>{a.status}</span>
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {AUDIENCE_LABELS[a.audience] ?? a.audience}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{a.content}</p>
                    <div className="mt-2 flex gap-3 text-xs text-zinc-500">
                      {a.publishedAt && <span>Published: {new Date(a.publishedAt).toLocaleDateString()}</span>}
                      <span>Created: {new Date(a.createdAt).toLocaleDateString()}</span>
                      {a.expiresAt && <span>Expires: {new Date(a.expiresAt).toLocaleDateString()}</span>}
                      {a.group && <span>Class: {a.group.name}</span>}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-1">
                    {a.status === "DRAFT" && (
                      <button onClick={() => startTransition(() => publish(a.id))} className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-950" title="Publish">
                        <Send className="h-4 w-4" />
                      </button>
                    )}
                    <Link href={`/announcements/new?edit=${a.id}`} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    {a.status !== "ARCHIVED" && (
                      <button onClick={() => startTransition(() => archive(a.id))} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Archive">
                        <Archive className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => startTransition(() => remove(a.id))} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
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

export default function AnnouncementsPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <AnnouncementsInner />
      </Suspense>
    </div>
  );
}
