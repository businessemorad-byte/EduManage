"use client";

import { useEffect, useState } from "react";

type UsageItem = {
  featureKey: string;
  label: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  percentage: number | null;
};

export default function UsagePage() {
  const [usage, setUsage] = useState<UsageItem[]>([]);

  useEffect(() => {
    fetch("/api/billing/usage")
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Usage</h1>

      <div className="border rounded-lg p-6 bg-white dark:bg-zinc-900 space-y-4">
        {usage.length === 0 ? (
          <p className="text-zinc-500">No usage data available</p>
        ) : usage.map((item) => (
          <div key={item.featureKey} className="flex items-center gap-4">
            <div className="w-32">
              <p className="font-medium text-sm">{item.label}</p>
            </div>
            {item.limit !== null ? (
              <>
                <div className="flex-1">
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        (item.percentage ?? 0) > 90 ? "bg-red-500" :
                        (item.percentage ?? 0) > 70 ? "bg-yellow-500" :
                        "bg-blue-600"
                      }`}
                      style={{ width: `${Math.min(100, item.percentage ?? 0)}%` }}
                    />
                  </div>
                </div>
                <div className="w-36 text-right text-sm text-zinc-600">
                  <span className="font-medium">{item.used}</span> / {item.limit.toLocaleString()}
                  {item.remaining !== null && <span className="text-zinc-400 ml-1">({item.remaining.toLocaleString()} left)</span>}
                </div>
              </>
            ) : (
              <div className="flex-1 text-sm text-zinc-500">{item.used.toLocaleString()} used (unlimited)</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
