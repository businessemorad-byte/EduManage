"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LoadingState } from "@/components/ui/loading-state";

const AUDIENCES = [
  { value: "ALL_STUDENTS", label: "All Students" },
  { value: "ALL_PARENTS", label: "All Parents" },
  { value: "ALL_TEACHERS", label: "All Teachers" },
  { value: "ALL_STAFF", label: "All Staff" },
  { value: "SPECIFIC_CLASS", label: "Specific Class" },
  { value: "SPECIFIC_BRANCH", label: "Specific Branch" },
];

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    content: "",
    audience: "ALL_STUDENTS",
    expiresAt: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          audience: form.audience,
          expiresAt: form.expiresAt || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create announcement");
        setSaving(false);
        return;
      }
      router.push("/announcements");
    } catch {
      setError("Failed to create announcement");
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div className="p-8">
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Announcement</h1>
          <p className="mt-1 text-sm text-zinc-500">Create an announcement for your organization.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Title *</label>
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" required />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Content *</label>
            <textarea rows={6} className={inputCls} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write your announcement..." required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Audience</label>
              <select className={inputCls} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Expires At (optional)</label>
              <input type="date" className={inputCls} value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
              {saving ? "Creating..." : "Create Announcement"}
            </button>
            <button type="button" onClick={() => router.back()} className="rounded-lg border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
