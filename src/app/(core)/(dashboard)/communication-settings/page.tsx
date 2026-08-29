"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";

type Settings = {
  senderName: string | null;
  senderEmail: string | null;
  replyToEmail: string | null;
  defaultLanguage: string;
  timezone: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  pushEnabled: boolean;
};

type Provider = {
  id: string;
  name: string;
  channel: string;
  provider: string;
  enabled: boolean;
  status: string;
  lastTestStatus: string | null;
};

export default function CommunicationSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/communication/settings").then((r) => r.json()),
      fetch("/api/communication/providers").then((r) => r.json()),
    ])
      .then(([s, p]) => {
        setSettings(s.settings);
        setProviders(p.providers ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    await fetch("/api/communication/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
  };

  const testProvider = async (id: string) => {
    await fetch("/api/communication/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test", id }),
    });
  };

  if (loading) return <LoadingState />;
  if (!settings) return <div className="text-sm text-zinc-500">Failed to load settings.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Communication Settings</h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">General</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Sender Name</label>
            <input
              type="text"
              value={settings.senderName ?? ""}
              onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Sender Email</label>
            <input
              type="email"
              value={settings.senderEmail ?? ""}
              onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Reply-To Email</label>
            <input
              type="email"
              value={settings.replyToEmail ?? ""}
              onChange={(e) => setSettings({ ...settings, replyToEmail: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Timezone</label>
            <input
              type="text"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Channel Toggles</h2>
        <div className="space-y-3">
          {([
            ["emailEnabled", "Email", "Send emails via configured provider"],
            ["smsEnabled", "SMS", "Send SMS via configured provider"],
            ["whatsappEnabled", "WhatsApp", "Send WhatsApp messages via configured provider"],
            ["pushEnabled", "Push Notifications", "Show in-app push notifications"],
          ] as const).map(([key, label, desc]) => (
            <label key={key} className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3">
              <div>
                <span className="text-sm font-medium">{label}</span>
                <p className="text-xs text-zinc-500">{desc}</p>
              </div>
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-300"
              />
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={saveSettings}
        disabled={saving}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Providers</h2>
        {providers.length === 0 ? (
          <p className="text-sm text-zinc-500">No providers configured. Add a provider to enable email/SMS delivery.</p>
        ) : (
          <div className="space-y-2">
            {providers.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3">
                <div>
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="ml-2 inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium">{p.channel}</span>
                  <span className="ml-2 text-xs text-zinc-500">{p.provider}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${p.status === "ACTIVE" ? "bg-green-500" : "bg-zinc-400"}`} />
                  <button
                    onClick={() => testProvider(p.id)}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
                  >
                    Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
