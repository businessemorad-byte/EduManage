"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft } from "lucide-react";

const CURRENCIES = ["USD", "EUR", "MAD"];

const FREQUENCIES: { value: string; label: string }[] = [
  { value: "ONE_TIME", label: "One-time" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "CUSTOM", label: "Custom" },
];

export default function NewFeePlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/fee-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description") || undefined,
        amount: Number(form.get("amount")),
        currency: form.get("currency"),
        frequency: form.get("frequency"),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create fee plan");
      setLoading(false);
      return;
    }

    router.push("/fee-plans");
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Create Fee Plan"
        description="Define a fee structure for your programs."
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
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
              placeholder="e.g. Monthly Tuition"
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="What does this fee cover?"
              className="mt-1 block w-full resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Amount
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="e.g. 1500"
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Displayed in DH on invoices.</p>
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                defaultValue="USD"
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Frequency
            </label>
            <select
              id="frequency"
              name="frequency"
              defaultValue="ONE_TIME"
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Fee Plan"}
          </button>
        </form>
      </div>
    </div>
  );
}
