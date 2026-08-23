"use client";

import { useEffect, useState } from "react";

type Insight = {
  id: string;
  category: string;
  title: string;
  summary: string;
  severity: string;
  isRead: boolean;
  createdAt: string;
};

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    const url = filter ? `/api/ai/insights?category=${filter}` : "/api/ai/insights";
    fetch(url)
      .then((r) => r.json())
      .then(setInsights)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const markRead = async (id: string) => {
    await fetch("/api/ai/insights", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setInsights((prev) => prev.map((i) => i.id === id ? { ...i, isRead: true } : i));
  };

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>

      <div className="flex gap-2">
        {["", "attendance", "finance", "academic", "report", "crm"].map((cat) => (
          <button
            key={cat}
            onClick={() => { setFilter(cat); setLoading(true); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              filter === cat ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {cat || "All"}
          </button>
        ))}
      </div>

      {insights.length === 0 ? (
        <p className="text-sm text-zinc-500">No insights yet.</p>
      ) : (
        <div className="space-y-2">
          {insights.map((i) => (
            <div key={i.id} className={`rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 ${!i.isRead ? "border-l-4 border-l-blue-500" : ""}`}>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  i.severity === "CRITICAL" ? "bg-red-100 text-red-700"
                  : i.severity === "WARNING" ? "bg-amber-100 text-amber-700"
                  : "bg-zinc-100 text-zinc-700"
                }`}>{i.severity}</span>
                <span className="text-xs text-zinc-500">{i.category}</span>
                <span className="text-xs text-zinc-500">{new Date(i.createdAt).toLocaleDateString()}</span>
                {!i.isRead && (
                  <button onClick={() => markRead(i.id)} className="text-xs text-blue-600 hover:underline">Mark read</button>
                )}
              </div>
              <h3 className="mt-2 font-semibold">{i.title}</h3>
              <p className="text-sm text-zinc-500">{i.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
