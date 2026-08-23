"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Crown,
  Users,
  Building2,
  CreditCard,
  ArrowUpRight,
  GraduationCap,
  Briefcase,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

type TopOrg = {
  id: string;
  name: string;
  type: string;
  plan: string | null;
  subscriptionStatus: string | null;
  students: number;
  staff: number;
  groups: number;
  aiCredits: {
    total: number;
    used: number;
    remaining: number;
    usagePct: number | null;
  };
};

type PlatformStats = {
  totalUsers: number;
  totalOrganizations: number;
  activeOrganizations: number;
  activeSubscriptions: number;
  subscriptionStatusCounts: Record<string, number>;
  trialOrganizations: number;
  pastDueOrganizations: number;
  planDistribution: Record<string, number>;
  estimatedMonthlyRecurringRevenue: number;
  totals: { students: number; staff: number; groups: number };
  ai: {
    organizationsWithBalance: number;
    monthlyAllowance: number;
    extraCredits: number;
    usedThisMonth: number;
    remaining: number;
    totalRequests: number;
  };
  topOrganizationsByStudents: TopOrg[];
};

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

export default function PlatformDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/platform/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setStats)
      .catch(() => setError("Could not load platform stats"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Platform Dashboard"
        description="Monitor platform-wide metrics and performance."
        icon={<Crown className="h-5 w-5" />}
      />

      {error && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total Users"
              value={stats.totalUsers.toLocaleString()}
              icon={<Users className="h-5 w-5" />}
              gradient="blue"
            />
            <StatCard
              label="Organizations"
              value={stats.totalOrganizations.toLocaleString()}
              subtitle={`${stats.activeOrganizations} actives`}
              icon={<Building2 className="h-5 w-5" />}
              gradient="green"
            />
            <StatCard
              label="Active Subscriptions"
              value={stats.activeSubscriptions.toLocaleString()}
              subtitle={
                [
                  stats.trialOrganizations > 0 ? `${stats.trialOrganizations} en essai` : null,
                  stats.pastDueOrganizations > 0 ? `${stats.pastDueOrganizations} en retard` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || undefined
              }
              icon={<CreditCard className="h-5 w-5" />}
              gradient="purple"
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Élèves (plateforme)"
              value={stats.totals.students.toLocaleString()}
              icon={<GraduationCap className="h-5 w-5" />}
              gradient="amber"
            />
            <StatCard
              label="Personnel (plateforme)"
              value={stats.totals.staff.toLocaleString()}
              icon={<Briefcase className="h-5 w-5" />}
              gradient="blue"
            />
            <StatCard
              label="Revenu mensuel estimé"
              value={`${stats.estimatedMonthlyRecurringRevenue.toLocaleString()} MAD`}
              subtitle={`${Object.keys(stats.planDistribution).length} plans actifs`}
              icon={<TrendingUp className="h-5 w-5" />}
              gradient="green"
            />
          </div>

          {/* AI credits overview */}
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-500" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Crédits IA</h3>
                <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
                  {stats.ai.organizationsWithBalance} organisations suivies
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">Dotation mensuelle</dt>
                  <dd className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-white">
                    {formatCompact(stats.ai.monthlyAllowance)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">Packs achetés</dt>
                  <dd className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-white">
                    {formatCompact(stats.ai.extraCredits)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">Consommés ce mois</dt>
                  <dd className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-white">
                    {formatCompact(stats.ai.usedThisMonth)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">Restants</dt>
                  <dd className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-white">
                    {formatCompact(stats.ai.remaining)}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                {stats.ai.totalRequests.toLocaleString()} requêtes IA au total
              </p>
            </div>

            <div className="rounded-xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Répartition des plans</h3>
              {Object.keys(stats.planDistribution).length === 0 ? (
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Aucun abonnement actif.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {Object.entries(stats.planDistribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([plan, count]) => {
                      const maxCount = Math.max(...Object.values(stats.planDistribution));
                      return (
                        <li key={plan} className="flex items-center gap-3 text-sm">
                          <span className="w-40 truncate text-zinc-700 dark:text-zinc-300">{plan}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{ width: `${Math.max(4, (count / maxCount) * 100)}%` }}
                            />
                          </div>
                          <span className="w-8 text-right font-medium text-zinc-900 dark:text-white">{count}</span>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </div>

          {/* Top organizations */}
          <div className="mt-8 overflow-hidden rounded-xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Principales organisations (par élèves)
              </h3>
            </div>
            {stats.topOrganizationsByStudents.length === 0 ? (
              <p className="px-5 py-6 text-sm text-zinc-500 dark:text-zinc-400">Aucune organisation.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      <th className="px-5 py-3 font-medium">Organisation</th>
                      <th className="px-5 py-3 font-medium">Plan</th>
                      <th className="px-5 py-3 text-right font-medium">Élèves</th>
                      <th className="px-5 py-3 text-right font-medium">Groupes</th>
                      <th className="px-5 py-3 text-right font-medium">IA utilisé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topOrganizationsByStudents.map((org) => (
                      <tr key={org.id} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="px-5 py-3">
                          <p className="font-medium text-zinc-900 dark:text-white">{org.name}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {org.subscriptionStatus ?? "Sans abonnement"}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">{org.plan ?? "—"}</td>
                        <td className="px-5 py-3 text-right text-zinc-900 dark:text-white">{org.students}</td>
                        <td className="px-5 py-3 text-right text-zinc-600 dark:text-zinc-300">{org.groups}</td>
                        <td className="px-5 py-3 text-right">
                          <span
                            className={
                              org.aiCredits.usagePct !== null && org.aiCredits.usagePct >= 80
                                ? "font-medium text-red-600 dark:text-red-400"
                                : "text-zinc-600 dark:text-zinc-300"
                            }
                          >
                            {org.aiCredits.usagePct !== null ? `${org.aiCredits.usagePct}%` : "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      <div className="mt-8">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">Quick Links</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/platform/billing"
            className="group flex items-start gap-3 rounded-xl border border-zinc-100 bg-white p-4 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Billing & Plans</p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Manage subscription plans, coupons, and view billing metrics
              </p>
            </div>
            <ArrowUpRight className="mt-1 h-4 w-4 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-500 dark:text-zinc-600" />
          </Link>
        </div>
      </div>
    </div>
  );
}
