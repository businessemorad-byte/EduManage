"use client";

import { useEffect, useState } from "react";

type Recommendation = {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  suggestedAction: string | null;
  status: string;
  createdAt: string;
};

export default function AIRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/ai/recommendations")
      .then((r) => r.json())
      .then(setRecommendations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      const data = await res.json();
      if (data.recommendations) setRecommendations(data.recommendations);
    } catch {}
    setGenerating(false);
  };

  const updateStatus = async (id: string, status: "ACCEPTED" | "DISMISSED") => {
    try {
      await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id, status }),
      });
      setRecommendations((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    } catch {}
  };

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Recommendations</h1>
        <button onClick={generate} disabled={generating} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
          {generating ? "Generating..." : "Generate Recommendations"}
        </button>
      </div>

      {recommendations.length === 0 ? (
        <p className="text-sm text-zinc-500">No recommendations yet. Click Generate to create some.</p>
      ) : (
        <div className="space-y-3">
          {recommendations.map((r) => (
            <div key={r.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  r.priority === "CRITICAL" ? "bg-red-100 text-red-700"
                  : r.priority === "HIGH" ? "bg-orange-100 text-orange-700"
                  : r.priority === "MEDIUM" ? "bg-amber-100 text-amber-700"
                  : "bg-zinc-100 text-zinc-700"
                }`}>{r.priority}</span>
                <span className="text-xs text-zinc-500">{r.type}</span>
                <span className={`text-xs ${r.status === "ACCEPTED" ? "text-green-600" : r.status === "DISMISSED" ? "text-zinc-500" : "text-amber-600"}`}>{r.status}</span>
              </div>
              <h3 className="mt-2 font-semibold">{r.title}</h3>
              <p className="text-sm text-zinc-500">{r.description}</p>
              {r.suggestedAction && <p className="mt-1 text-sm text-blue-600">Action: {r.suggestedAction}</p>}
              {r.status === "PENDING" && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => updateStatus(r.id, "ACCEPTED")} className="rounded bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200">Accept</button>
                  <button onClick={() => updateStatus(r.id, "DISMISSED")} className="rounded bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200">Dismiss</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
