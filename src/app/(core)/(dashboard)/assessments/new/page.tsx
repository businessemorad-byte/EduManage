"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewAssessmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description") || undefined,
        maxScore: form.get("maxScore") ? Number(form.get("maxScore")) : undefined,
        weight: form.get("weight") ? Number(form.get("weight")) : undefined,
        date: form.get("date") || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create assessment");
      setLoading(false);
      return;
    }

    router.push("/assessments");
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="text-2xl font-bold tracking-tight">New Assessment</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700">Name</label>
          <input name="name" required className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Description</label>
          <textarea name="description" rows={2} className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Max Score</label>
            <input name="maxScore" type="number" min="1" defaultValue={100} className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Weight %</label>
            <input name="weight" type="number" min="0" max="100" step="0.1" className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Date</label>
            <input name="date" type="date" className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Assessment"}
        </button>
      </form>
    </div>
  );
}
