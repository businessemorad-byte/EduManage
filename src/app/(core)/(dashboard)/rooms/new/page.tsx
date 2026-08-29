"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft } from "lucide-react";

const ROOM_TYPES = ["CLASSROOM", "LAB", "AUDITORIUM", "OFFICE", "CONFERENCE", "COMPUTER_LAB", "WORKSHOP", "OTHER"];

export default function NewRoomPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("CLASSROOM");
  const [capacity, setCapacity] = useState(30);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, capacity }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create room");
      setLoading(false);
      return;
    }

    router.push("/rooms");
  }

  return (
    <div className="animate-fade-in max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg border border-zinc-200 p-2 transition-colors hover:bg-zinc-50">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageHeader title="New Room" description="Add a new room or facility." icon={<span className="text-lg">🏫</span>} />
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6">
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" placeholder="e.g. Room 101, Lab A" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
                {ROOM_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Capacity</label>
              <input type="number" min="1" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50">Cancel</button>
          <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50">
            {loading ? "Creating..." : "Create Room"}
          </button>
        </div>
      </form>
    </div>
  );
}
