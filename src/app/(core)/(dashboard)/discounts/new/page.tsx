"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft, Coins } from "lucide-react";

export default function NewDiscountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const maxUsesRaw = form.get("maxUses");

    const res = await fetch("/api/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description") || undefined,
        type: form.get("type"),
        value: Number(form.get("value")),
        maxUses: maxUsesRaw ? Number(maxUsesRaw) : undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create discount");
      setLoading(false);
      return;
    }

    router.push("/discounts");
  }

  const inputClass =
    "mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
  const labelClass =
    "block text-sm font-medium text-zinc-700";

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="New Discount"
        description="Create a discount for special pricing."
        icon={<Coins className="h-5 w-5" />}
        action={
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        }
      />

      <div className="mx-auto max-w-lg">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className={labelClass}>
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="e.g. Back to School"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Optional description..."
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="type" className={labelClass}>
              Type
            </label>
            <select id="type" name="type" required defaultValue="PERCENTAGE" className={inputClass}>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed (DH)</option>
            </select>
          </div>

          <div>
            <label htmlFor="value" className={labelClass}>
              Value
            </label>
            <input
              id="value"
              name="value"
              type="number"
              min={0}
              step="any"
              required
              placeholder="e.g. 10 or 200"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="maxUses" className={labelClass}>
              Max Uses
            </label>
            <input
              id="maxUses"
              name="maxUses"
              type="number"
              min={1}
              placeholder="Leave empty for unlimited"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-zinc-400">
              Leave empty for unlimited uses.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Discount"}
          </button>
        </form>
      </div>
    </div>
  );
}
