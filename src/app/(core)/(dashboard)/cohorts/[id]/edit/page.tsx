"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import { LoadingState } from "@/components/ui/loading-state";

type CohortData = {
  id: string;
  name: string;
  code: string | null;
  capacity: number | null;
  cohortStatus: string | null;
  startDate: string | null;
  endDate: string | null;
  program: { id: string; name: string } | null;
  classTeacher: { id: string; staff: { person: { firstName: string; lastName: string } } } | null;
};

const STATUSES = ["PLANNED", "OPEN", "ACTIVE", "COMPLETED", "CANCELED", "ARCHIVED"];

function EditCohortForm() {
  const params = useParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    capacity: "",
    cohortStatus: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    const id = params.id as string;
    fetch("/api/cohorts?search=" + encodeURIComponent(id))
      .then((r) => r.json())
      .then((data) => {
        const found = (data.cohorts ?? []).find((c: CohortData) => c.id === id);
        if (found) {
          setForm({
            name: found.name,
            capacity: found.capacity?.toString() ?? "",
            cohortStatus: found.cohortStatus ?? "PLANNED",
            startDate: found.startDate ? found.startDate.split("T")[0] : "",
            endDate: found.endDate ? found.endDate.split("T")[0] : "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const id = params.id as string;
    const body = {
      action: "update",
      id,
      name: form.name || undefined,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      cohortStatus: form.cohortStatus || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    };
    const res = await fetch("/api/cohorts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update cohort");
      return;
    }
    startTransition(() => router.push("/cohorts/" + id));
  };

  if (loading) return <LoadingState />;

  const inputCls = "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Cohort Name</label>
        <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Cohort name" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Capacity</label>
          <input type="number" min="1" className={inputCls} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="Max learners" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
          <select className={inputCls} value={form.cohortStatus} onChange={(e) => setForm({ ...form, cohortStatus: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Start Date</label>
          <input type="date" className={inputCls} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">End Date</label>
          <input type="date" className={inputCls} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={pending || saving} className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function EditCohortPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Cohort</h1>
            <p className="mt-1 text-sm text-zinc-500">Update cohort details, status, and dates.</p>
          </div>
          <EditCohortForm />
        </div>
      </Suspense>
    </div>
  );
}
