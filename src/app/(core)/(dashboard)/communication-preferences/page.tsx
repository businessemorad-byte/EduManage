"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";

type Preference = {
  id: string;
  category: string;
  channel: string;
  enabled: boolean;
};

const CATEGORIES = ["attendance", "finance", "academic", "system", "automation", "marketing", "communication"];
const CATEGORY_LABELS: Record<string, string> = {
  attendance: "Attendance",
  finance: "Finance",
  academic: "Academic",
  system: "System",
  automation: "Automation",
  marketing: "Marketing",
  communication: "Communication",
};
const CHANNELS = ["IN_APP", "EMAIL", "SMS"];
const CHANNEL_LABELS: Record<string, string> = { IN_APP: "In-App", EMAIL: "Email", SMS: "SMS" };

export default function CommunicationPreferencesPage() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/communication/preferences")
      .then((r) => r.json())
      .then((data) => setPreferences(data.preferences ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const togglePref = async (category: string, channel: string, currentEnabled: boolean) => {
    setSaving(true);
    try {
      await fetch("/api/communication/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, channel, enabled: !currentEnabled }),
      });
      setPreferences((prev) => {
        const idx = prev.findIndex((p) => p.category === category && p.channel === channel);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], enabled: !currentEnabled };
          return updated;
        }
        return [...prev, { id: "new", category, channel, enabled: !currentEnabled }];
      });
    } catch {}
    setSaving(false);
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notification Preferences</h1>
        <p className="mt-1 text-sm text-zinc-500">Control which notifications you receive and how.</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Category</th>
              {CHANNELS.map((ch) => (
                <th key={ch} className="px-4 py-3 text-center font-medium text-zinc-600 dark:text-zinc-400">{CHANNEL_LABELS[ch]}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {CATEGORIES.map((cat) => (
              <tr key={cat} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <td className="px-4 py-3 font-medium">{CATEGORY_LABELS[cat] ?? cat}</td>
                {CHANNELS.map((ch) => {
                  const pref = preferences.find((p) => p.category === cat && p.channel === ch);
                  const enabled = pref?.enabled ?? false;
                  return (
                    <td key={ch} className="px-4 py-3 text-center">
                      <button
                        onClick={() => togglePref(cat, ch, enabled)}
                        disabled={saving}
                        className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          enabled ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-300 dark:bg-zinc-600"
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enabled ? "translate-x-6" : "translate-x-1"
                        }`} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
