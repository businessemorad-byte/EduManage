"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";

type Anomaly = {
  type: string;
  severity: string;
  title: string;
  description: string;
  entityType: string;
  detectedAt: string;
};

type Recommendation = {
  type: string;
  priority: string;
  title: string;
  description: string;
  suggestedAction: string;
  entityType?: string;
  status: string;
};

export default function AIActionCenterPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"anomalies" | "recommendations">("anomalies");

  useEffect(() => {
    Promise.all([
      fetch("/api/ai/anomalies").then((r) => r.json()),
      fetch("/api/ai/recommendations").then((r) => r.json()),
    ])
      .then(([a, r]) => { setAnomalies(a); setRecommendations(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const refreshRecommendations = async () => {
    const res = await fetch("/api/ai/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate" }),
    });
    const data = await res.json();
    if (data.recommendations) setRecommendations(data.recommendations);
  };

  const updateRecommendation = async (id: string, status: "ACCEPTED" | "DISMISSED") => {
    await fetch("/api/ai/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id, status }),
    });
    setRecommendations((prev) => prev.map((r) => r === prev.find((x) => x === r) ? { ...r, status } : r));
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Action Center</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("anomalies")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            activeTab === "anomalies" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"
          }`}
        >
          Anomalies ({anomalies.length})
        </button>
        <button
          onClick={() => setActiveTab("recommendations")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            activeTab === "recommendations" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"
          }`}
        >
          Recommendations ({recommendations.length})
        </button>
      </div>

      {activeTab === "anomalies" && (
        <div className="space-y-2">
          {anomalies.length === 0 ? (
            <p className="text-sm text-zinc-500">No anomalies detected.</p>
          ) : (
            anomalies.map((a, i) => (
              <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    a.severity === "CRITICAL" ? "bg-red-100 text-red-700"
                    : a.severity === "WARNING" ? "bg-amber-100 text-amber-700"
                    : "bg-zinc-100 text-zinc-700"
                  }`}>{a.severity}</span>
                  <span className="text-xs text-zinc-500">{a.entityType}</span>
                </div>
                <h3 className="mt-2 font-semibold">{a.title}</h3>
                <p className="text-sm text-zinc-500">{a.description}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "recommendations" && (
        <div className="space-y-2">
          <div className="flex justify-end">
            <button
              onClick={refreshRecommendations}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Refresh
            </button>
          </div>
          {recommendations.length === 0 ? (
            <p className="text-sm text-zinc-500">No recommendations yet. Click Refresh to generate.</p>
          ) : (
            recommendations.map((r, i) => (
              <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    r.priority === "HIGH" || r.priority === "CRITICAL" ? "bg-red-100 text-red-700"
                    : r.priority === "MEDIUM" ? "bg-amber-100 text-amber-700"
                    : "bg-zinc-100 text-zinc-700"
                  }`}>{r.priority}</span>
                  <span className="text-xs text-zinc-500">{r.type}</span>
                  {r.status !== "PENDING" && (
                    <span className="text-xs text-zinc-500">{r.status}</span>
                  )}
                </div>
                <h3 className="mt-2 font-semibold">{r.title}</h3>
                <p className="text-sm text-zinc-500">{r.description}</p>
                <p className="mt-1 text-sm text-blue-600">Action: {r.suggestedAction}</p>
                {r.status === "PENDING" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => updateRecommendation(r.title, "ACCEPTED")}
                      className="rounded bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => updateRecommendation(r.title, "DISMISSED")}
                      className="rounded bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
