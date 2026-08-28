"use client";

import { useFetch } from "@/hooks/use-fetch";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatCardSkeleton } from "@/components/dashboard/skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { Zap, Play, Pause, Activity, Clock } from "lucide-react";
import Link from "next/link";

type StatsData = {
  totalRules: number;
  activeRules: number;
  pausedRules: number;
  totalExecutions: number;
  todayExecutions: number;
  recentLogs: {
    id: string;
    ruleName: string;
    trigger: string;
    status: string;
    error: string | null;
    executedAt: string;
  }[];
};

export default function AutomationOverviewPage() {
  const { data, loading, error } = useFetch<StatsData>("/api/automation/stats");

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load automation stats.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Automation"
        description="Automate actions based on events"
        action={
          <Link
            href="/automation/rules/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Zap className="h-4 w-4" />
            Create Rule
          </Link>
        }
        icon={<Zap className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Rules"
          value={data?.totalRules ?? 0}
          icon={<Zap className="h-5 w-5" />}
          gradient="blue"
        />
        <StatCard
          label="Active Rules"
          value={data?.activeRules ?? 0}
          icon={<Play className="h-5 w-5" />}
          gradient="green"
        />
        <StatCard
          label="Paused Rules"
          value={data?.pausedRules ?? 0}
          icon={<Pause className="h-5 w-5" />}
          gradient="amber"
        />
        <StatCard
          label="Executions Today"
          value={data?.todayExecutions ?? 0}
          icon={<Clock className="h-5 w-5" />}
          gradient="purple"
        />
        <StatCard
          label="Total Executions"
          value={data?.totalExecutions ?? 0}
          icon={<Activity className="h-5 w-5" />}
          gradient="slate"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Recent Activity</h2>
          <Link
            href="/automation/logs"
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            View All
          </Link>
        </div>
        {!data?.recentLogs?.length ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 py-8 text-center">
            No recent executions. Rules will log activity here when triggered.
          </p>
        ) : (
          <div className="space-y-3">
            {data.recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                    {log.ruleName}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {log.trigger} · {new Date(log.executedAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    log.status === "success"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
