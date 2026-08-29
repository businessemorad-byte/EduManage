"use client";

import { useRouter } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { LoadingState } from "@/components/ui/loading-state";

const categories = ["PROFESSIONAL", "TECHNICAL", "LANGUAGE", "SOFT_SKILLS", "COMPLIANCE", "OTHER"];
const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];

function NewProgramForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    trainingCategory: "PROFESSIONAL",
    duration: "",
    level: "BEGINNER",
    objectives: "",
    prerequisites: "",
    price: "",
    certificateEligibility: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const body = { ...form, price: form.price ? Number(form.price) : undefined };
    const res = await fetch("/api/training-programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create program");
      return;
    }
    const data = await res.json();
    startTransition(() => router.push("/training-programs/" + data.program.id));
  };

  const inputCls = "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Program Name *</label>
        <input required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Web Development Bootcamp" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Code</label>
          <input className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. WDB-2026" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Duration</label>
          <input className={inputCls} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 3 months" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Category</label>
          <select className={inputCls} value={form.trainingCategory} onChange={(e) => setForm({ ...form, trainingCategory: e.target.value })}>
            {categories.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Level</label>
          <select className={inputCls} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
            {levels.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Description</label>
        <textarea rows={3} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Program description..." />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Objectives</label>
        <textarea rows={3} className={inputCls} value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} placeholder="Learning objectives..." />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Prerequisites</label>
        <textarea rows={2} className={inputCls} value={form.prerequisites} onChange={(e) => setForm({ ...form, prerequisites: e.target.value })} placeholder="Prerequisites..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Price (DA)</label>
          <input type="number" min="0" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={form.certificateEligibility} onChange={(e) => setForm({ ...form, certificateEligibility: e.target.checked })} className="h-4 w-4 rounded border-zinc-300" />
            Certificate Eligible
          </label>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
          {pending ? "Creating..." : "Create Program"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function NewProgramPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Training Program</h1>
            <p className="mt-1 text-sm text-zinc-500">Create a new training program for your organization.</p>
          </div>
          <NewProgramForm />
        </div>
      </Suspense>
    </div>
  );
}