"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft, CalendarDays } from "lucide-react";

export default function NewAcademicYearPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/academic-years", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        startDate: form.get("startDate"),
        endDate: form.get("endDate") || undefined,
        isCurrent: form.get("isCurrent") === "on",
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create academic year");
      setLoading(false);
      return;
    }

    router.push("/academic-years");
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="New Academic Year"
        description="Create a new academic year."
        icon={<CalendarDays className="h-5 w-5" />}
        action={
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        }
      />

      <div className="mx-auto max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="e.g. 2026-2027"
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Start Date
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                required
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                End Date
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isCurrent"
              name="isCurrent"
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <label htmlFor="isCurrent" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Set as current academic year
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Academic Year"}
          </button>
        </form>
      </div>
    </div>
  );
}
