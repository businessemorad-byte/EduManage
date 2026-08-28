"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BillingData = {
  subscription: {
    plan: { displayName: string; code: string };
    status: string;
    billingInterval: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
  } | null;
  billingState: { state: string; hasAccess: boolean; lapsed: boolean };
  aiCredits: {
    included: number;
    used: number;
    extra: number;
    remaining: number;
    periodStart: string;
    periodEnd: string | null;
  };
  packages: Array<{ id: string; credits: number; priceMad: number; label: string }>;
  promotion: { active: boolean; firstMonthDiscountPct: number; label: string };
  usage: Array<{ featureKey: string; label: string; used: number; limit: number | null; remaining: number | null; percentage: number | null }>;
  recentInvoices: Array<{ id: string; invoiceNumber: string; totalAmount: number; status: string; issuedAt: string }>;
  payments: Array<{ id: string; amount: number; status: string; createdAt: string }>;
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  TRIAL: "bg-blue-100 text-blue-800",
  TRIALING: "bg-blue-100 text-blue-800",
  PAST_DUE: "bg-yellow-100 text-yellow-800",
  SUSPENDED: "bg-orange-100 text-orange-800",
  EXPIRED: "bg-red-100 text-red-800",
  CANCELLED: "bg-zinc-200 text-zinc-700",
};

function formatMAD(amount: number): string {
  return amount.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  async function buyPackage(packageId: string) {
    setPurchasing(packageId);
    try {
      await fetch("/api/billing/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const refreshed = await fetch("/api/billing/dashboard").then((r) => r.json());
      setData(refreshed);
    } finally {
      setPurchasing(null);
    }
  }

  if (!data) {
    return <div className="p-8 text-center text-zinc-500">Chargement de la facturation...</div>;
  }

  const sub = data.subscription;
  const state = data.billingState?.state ?? "NONE";
  const isExpired = state === "EXPIRED" || state === "NONE" || state === "CANCELLED";
  const credits = data.aiCredits;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">Facturation & Abonnement</h1>

      {/* Expired / no-subscription banner */}
      {isExpired && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold text-red-900">Votre abonnement a expiré.</p>
            <p className="text-sm text-red-700 mt-1">
              Vos données restent en sécurité. Renouvelez pour retrouver l&apos;accès aux fonctionnalités.
            </p>
          </div>
          <Link
            href="/billing/plans"
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition"
          >
            Renouveler mon abonnement
          </Link>
        </div>
      )}

      {/* Current Plan */}
      <div className="border rounded-xl p-6 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Plan actuel</h2>
          {sub && sub.status !== "ACTIVE" && (
            <Link href="/billing/plans" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Changer de plan →
            </Link>
          )}
        </div>
        {sub ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-zinc-500">Plan</p>
              <p className="font-medium">{sub.plan.displayName}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Statut</p>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[sub.status] ?? "bg-zinc-100 text-zinc-700"}`}>
                {sub.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Facturation</p>
              <p className="font-medium">{sub.billingInterval === "YEARLY" ? "Annuelle" : "Mensuelle"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">{state === "EXPIRED" ? "Expiré le" : "Prochain renouvellement"}</p>
              <p className="font-medium">
                {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("fr-FR") : "N/A"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-zinc-500">
            Aucun abonnement.{" "}
            <Link href="/billing/plans" className="text-brand-600 hover:underline">
              Choisir un plan
            </Link>
          </p>
        )}
      </div>

      {/* AI Credits */}
      <div className="border rounded-xl p-6 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Crédits IA</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm text-zinc-500">Inclus / mois</p>
            <p className="font-semibold">{credits.included.toLocaleString("fr-FR")}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Utilisés</p>
            <p className="font-semibold">{credits.used.toLocaleString("fr-FR")}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Restants</p>
            <p className="font-semibold text-brand-700">{credits.remaining.toLocaleString("fr-FR")}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Crédits achetés</p>
            <p className="font-semibold">{credits.extra.toLocaleString("fr-FR")}</p>
          </div>
        </div>
        {credits.included > 0 && (
          <div className="w-full bg-zinc-100 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${credits.remaining === 0 ? "bg-red-500" : "bg-brand-600"}`}
              style={{
                width: `${Math.min(100, Math.round((credits.used / Math.max(1, credits.included)) * 100))}%`,
              }}
            />
          </div>
        )}

        {credits.remaining <= 0 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-900">Vos crédits IA sont épuisés.</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <span className="text-red-700">1. Attendre le prochain renouvellement ({credits.periodEnd ? new Date(credits.periodEnd).toLocaleDateString("fr-FR") : "—"})</span>
              <span className="text-red-700">2. Acheter des crédits supplémentaires ci-dessous</span>
            </div>
          </div>
        )}

        {/* Credit packages */}
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {data.packages.map((p) => (
            <button
              key={p.id}
              onClick={() => buyPackage(p.id)}
              disabled={purchasing === p.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 text-left hover:border-brand-400 hover:shadow-md transition disabled:opacity-50"
            >
              <p className="text-sm font-semibold text-zinc-900">{p.label}</p>
              <p className="mt-1 text-xs text-zinc-500">{formatMAD(p.priceMad)} DH</p>
              <p className="mt-2 text-xs font-medium text-brand-600">
                {purchasing === p.id ? "Achat..." : "Acheter"}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/billing/plans" className="border rounded-xl p-4 hover:bg-brand-50/50 transition text-center">
          <p className="font-medium">Plans</p>
          <p className="text-sm text-zinc-500">Comparer & changer</p>
        </Link>
        <Link href="/billing/usage" className="border rounded-xl p-4 hover:bg-brand-50/50 transition text-center">
          <p className="font-medium">Utilisation</p>
          <p className="text-sm text-zinc-500">Limites du plan</p>
        </Link>
        <Link href="/billing/invoices" className="border rounded-xl p-4 hover:bg-brand-50/50 transition text-center">
          <p className="font-medium">Factures</p>
          <p className="text-sm text-zinc-500">Historique</p>
        </Link>
        <Link href="/billing/subscription" className="border rounded-xl p-4 hover:bg-brand-50/50 transition text-center">
          <p className="font-medium">Abonnement</p>
          <p className="text-sm text-zinc-500">Gérer</p>
        </Link>
      </div>

      {/* Usage */}
      {data.usage.length > 0 && (
        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Utilisation</h2>
          <div className="space-y-3">
            {data.usage.filter((u) => u.limit !== null).map((u) => (
              <div key={u.featureKey} className="flex items-center justify-between">
                <span className="text-sm font-medium">{u.label}</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 bg-zinc-100 rounded-full h-2">
                    <div className="bg-brand-600 h-2 rounded-full" style={{ width: `${u.percentage ?? 0}%` }} />
                  </div>
                  <span className="text-sm text-zinc-600 w-28 text-right">{u.used} / {u.limit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      {data.recentInvoices.length > 0 && (
        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Factures récentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-zinc-500">
                  <th className="pb-2 font-medium">Facture</th>
                  <th className="pb-2 font-medium">Montant</th>
                  <th className="pb-2 font-medium">Statut</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="py-2">{inv.invoiceNumber}</td>
                    <td className="py-2">{formatMAD(Number(inv.totalAmount))} DH</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        inv.status === "PAID" ? "bg-green-100 text-green-800" :
                        inv.status === "OPEN" ? "bg-yellow-100 text-yellow-800" :
                        "bg-zinc-100 text-zinc-800"
                      }`}>{inv.status}</span>
                    </td>
                    <td className="py-2">{new Date(inv.issuedAt).toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
