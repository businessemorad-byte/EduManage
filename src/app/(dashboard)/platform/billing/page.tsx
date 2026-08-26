"use client";

import { useCallback, useEffect, useState } from "react";

type Metrics = {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  trialing: number;
  pastDue: number;
  failedPayments: number;
  churnRate: number;
  retention: number;
};

type Plan = {
  id: string;
  code: string;
  displayName: string;
  orgTypeKey: string | null;
  priceMonthlyMad: number;
  priceYearlyMad: number | null;
  aiCreditsMonthly: number;
  isActive: boolean;
};

type SubscriptionRow = {
  id: string;
  status: string;
  billingInterval: string;
  organizationName: string;
  planCode: string;
  planName: string;
  currentPeriodEnd: string | null;
};

type PlatformConfigData = {
  promotion: { active: boolean; firstMonthDiscountPct: number; label: string };
  ai: {
    providerName: string;
    modelId: string;
    modelDisplayName: string;
    baseUrl: string;
    apiKeyConfigured: boolean;
    source: "database" | "env" | "none";
  };
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  TRIAL: "bg-blue-100 text-blue-800",
  PAST_DUE: "bg-yellow-100 text-yellow-800",
  SUSPENDED: "bg-orange-100 text-orange-800",
  EXPIRED: "bg-red-100 text-red-800",
  CANCELLED: "bg-zinc-200 text-zinc-700",
  PENDING: "bg-zinc-100 text-zinc-600",
};

function dh(amount: number): string {
  return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} DH`;
}

export default function PlatformBillingPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [config, setConfig] = useState<PlatformConfigData | null>(null);
  const [tab, setTab] = useState<"plans" | "subscriptions" | "ai">("plans");
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [m, p, s, c] = await Promise.all([
      fetch("/api/billing/metrics").then((r) => r.json()).catch(() => null),
      fetch("/api/platform/billing/plans").then((r) => r.json()).catch(() => ({ plans: [] })),
      fetch(`/api/platform/billing/subscriptions${statusFilter ? `?status=${statusFilter}` : ""}`)
        .then((r) => r.json()).catch(() => ({ subscriptions: [] })),
      fetch("/api/platform/billing/config").then((r) => r.json()).catch(() => null),
    ]);
    setMetrics(m);
    setPlans(p.plans ?? []);
    setSubs(s.subscriptions ?? []);
    setConfig(c);
  }, [statusFilter]);

  useEffect(() => {
    // Defer via microtask so state updates happen outside the
    // synchronous effect body.
    void Promise.resolve().then(() => loadAll());
  }, [loadAll]);

  async function savePlan(plan: Plan) {
    setBusyId(plan.id);
    try {
      await fetch("/api/platform/billing/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          priceMonthlyMad: Number(plan.priceMonthlyMad),
          priceYearlyMad: plan.priceYearlyMad === null ? null : Number(plan.priceYearlyMad),
          isActive: plan.isActive,
        }),
      });
      await loadAll();
    } finally {
      setBusyId(null);
    }
  }

  async function subAction(subscriptionId: string, action: string) {
    setBusyId(subscriptionId);
    try {
      await fetch("/api/platform/billing/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, action }),
      });
      await loadAll();
    } finally {
      setBusyId(null);
    }
  }

  if (!metrics) return <div className="p-8 text-center text-zinc-500">Chargement...</div>;

  const cards = [
    { label: "MRR", value: dh(metrics.mrr) },
    { label: "ARR", value: dh(metrics.arr) },
    { label: "Abonnements actifs", value: metrics.activeSubscriptions },
    { label: "Essais", value: metrics.trialing },
    { label: "Impayés", value: metrics.pastDue },
    { label: "Paiements échoués", value: metrics.failedPayments },
    { label: "Taux de résiliation", value: `${metrics.churnRate}%` },
    { label: "Rétention", value: `${metrics.retention}%` },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Facturation plateforme</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="border rounded-lg p-4 bg-white">
            <p className="text-sm text-zinc-500">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["plans", "subscriptions", "ai"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {t === "plans" ? "Plans & tarifs" : t === "subscriptions" ? "Abonnements" : "Configuration IA"}
          </button>
        ))}
      </div>

      {/* Plans tab */}
      {tab === "plans" && (
        <div className="border rounded-xl bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-zinc-500">
                <th className="p-3 font-medium">Plan</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Mensuel (DH)</th>
                <th className="p-3 font-medium">Annuel (DH)</th>
                <th className="p-3 font-medium">Crédits IA</th>
                <th className="p-3 font-medium">Actif</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b last:border-0">
                  <td className="p-3">
                    <span className="font-medium">{plan.displayName}</span>
                    <span className="block text-xs text-zinc-400">{plan.code}</span>
                  </td>
                  <td className="p-3 text-zinc-600">{plan.orgTypeKey ?? "—"}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      min={0}
                      className="w-24 rounded-md border px-2 py-1"
                      value={plan.priceMonthlyMad}
                      onChange={(e) =>
                        setPlans((prev) =>
                          prev.map((p) => p.id === plan.id ? { ...p, priceMonthlyMad: Number(e.target.value) } : p)
                        )
                      }
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min={0}
                      placeholder="—"
                      className="w-24 rounded-md border px-2 py-1"
                      value={plan.priceYearlyMad ?? ""}
                      onChange={(e) =>
                        setPlans((prev) =>
                          prev.map((p) =>
                            p.id === plan.id
                              ? { ...p, priceYearlyMad: e.target.value === "" ? null : Number(e.target.value) }
                              : p
                          )
                        )
                      }
                    />
                  </td>
                  <td className="p-3">{plan.aiCreditsMonthly.toLocaleString("fr-FR")}</td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={plan.isActive}
                      onChange={(e) =>
                        setPlans((prev) =>
                          prev.map((p) => p.id === plan.id ? { ...p, isActive: e.target.checked } : p)
                        )
                      }
                    />
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => savePlan(plan)}
                      disabled={busyId === plan.id}
                      className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      Enregistrer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subscriptions tab */}
      {tab === "subscriptions" && (
        <div className="space-y-4">
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            {["ACTIVE", "TRIAL", "PAST_DUE", "SUSPENDED", "EXPIRED", "CANCELLED"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="border rounded-xl bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-zinc-500">
                  <th className="p-3 font-medium">Organisation</th>
                  <th className="p-3 font-medium">Plan</th>
                  <th className="p-3 font-medium">Statut</th>
                  <th className="p-3 font-medium">Fin de période</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((sub) => (
                  <tr key={sub.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{sub.organizationName}</td>
                    <td className="p-3">
                      <span className="font-medium">{sub.planName}</span>
                      <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        sub.planCode === "STARTER" ? "bg-zinc-100 text-zinc-600" :
                        sub.planCode === "STANDARD" ? "bg-blue-100 text-blue-700" :
                        sub.planCode === "PRO" ? "bg-purple-100 text-purple-700" :
                        sub.planCode === "ULTIMATE" ? "bg-amber-100 text-amber-700" :
                        "bg-zinc-100 text-zinc-600"
                      }`}>
                        {sub.planCode}
                      </span>
                      <span className="block text-xs text-zinc-400">
                        {sub.billingInterval === "YEARLY" ? "Annuel" : "Mensuel"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[sub.status] ?? "bg-zinc-100"}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {sub.status !== "ACTIVE" && sub.status !== "CANCELLED" && (
                          <button onClick={() => subAction(sub.id, "activate")} disabled={busyId === sub.id}
                            className="rounded-md border px-2.5 py-1 text-xs hover:bg-green-50 disabled:opacity-50">
                            Activer
                          </button>
                        )}
                        {(sub.status === "ACTIVE" || sub.status === "TRIAL") && (
                          <button onClick={() => subAction(sub.id, "suspend")} disabled={busyId === sub.id}
                            className="rounded-md border px-2.5 py-1 text-xs hover:bg-orange-50 disabled:opacity-50">
                            Suspendre
                          </button>
                        )}
                        {["ACTIVE", "PAST_DUE", "EXPIRED", "SUSPENDED"].includes(sub.status) && (
                          <button onClick={() => subAction(sub.id, "renew")} disabled={busyId === sub.id}
                            className="rounded-md border px-2.5 py-1 text-xs hover:bg-blue-50 disabled:opacity-50">
                            Renouveler
                          </button>
                        )}
                        {sub.status !== "CANCELLED" && (
                          <button onClick={() => subAction(sub.id, "cancel")} disabled={busyId === sub.id}
                            className="rounded-md border px-2.5 py-1 text-xs hover:bg-red-50 disabled:opacity-50">
                            Résilier
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {subs.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-zinc-500">Aucun abonnement trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI config tab */}
      {tab === "ai" && config && (
        <div className="max-w-xl space-y-4">
          <div className="border rounded-xl bg-white p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom du fournisseur</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={config.ai.providerName}
                onChange={(e) =>
                  setConfig({ ...config, ai: { ...config.ai, providerName: e.target.value } })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Identifiant du modèle</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={config.ai.modelId}
                onChange={(e) =>
                  setConfig({ ...config, ai: { ...config.ai, modelId: e.target.value } })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nom affiché</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={config.ai.modelDisplayName}
                onChange={(e) =>
                  setConfig({ ...config, ai: { ...config.ai, modelDisplayName: e.target.value } })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL de base</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={config.ai.baseUrl}
                onChange={(e) =>
                  setConfig({ ...config, ai: { ...config.ai, baseUrl: e.target.value } })
                }
              />
            </div>
            <p className="text-xs text-zinc-500">
              Clé API :{" "}
              {config.ai.apiKeyConfigured
                ? config.ai.source === "database"
                  ? "configurée en base (prioritaire)"
                  : "définie via la variable d'environnement AI_API_KEY"
                : "non configurée — les appels IA échoueront"}
            </p>
            <button
              onClick={async () => {
                await fetch("/api/platform/billing/config", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    aiProviderName: config.ai.providerName,
                    aiModelId: config.ai.modelId,
                    aiModelDisplayName: config.ai.modelDisplayName,
                    aiBaseUrl: config.ai.baseUrl || undefined,
                  }),
                });
                loadAll();
              }}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Enregistrer la configuration IA
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
