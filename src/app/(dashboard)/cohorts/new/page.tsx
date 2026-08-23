"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import { LoadingState } from "@/components/ui/loading-state";

type Program = { id: string; name: string };

function NewCohortForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [form, setForm] = useState({
    programId: "",
    name: "",
    capacity: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetch("/api/training-programs?limit=100")
      .then((r) => r.json())
      .then((data) => setPrograms(data.programs ?? []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const body = {
      ...form,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    };
    const res = await fetch("/api/cohorts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create cohort");
      return;
    }
    const data = await res.json();
    startTransition(() => router.push("/cohorts/" + data.cohort.id));
  };

  const inputCls = "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Program *</label>
        <select required className={inputCls} value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })}>
          <option value="">Select a program</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Cohort Name *</label>
        <input required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Web Dev - Batch 1" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Capacity</label>
          <input type="number" min="1" className={inputCls} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 30" />
        </div>
        <div></div>
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
        <button type="submit" disabled={pending} className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
          {pending ? "Creating..." : "Create Cohort"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function NewCohortPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Cohort</h1>
            <p className="mt-1 text-sm text-zinc-500">Create a new training cohort under a program.</p>
          </div>
          <NewCohortForm />
        </div>
      </Suspense>
    </div>
  );
}