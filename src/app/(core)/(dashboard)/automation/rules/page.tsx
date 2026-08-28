"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Zap, Play, Pause, Trash2, Search, ChevronRight } from "lucide-react";
import Link from "next/link";

type Condition = { field: string; operator: string; value: unknown };
type Action = { type: string; config: Record<string, unknown> };
type Rule = {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  trigger: string;
  conditions: Condition[];
  actions: Action[];
  executionCount: number;
  lastTriggeredAt: string | null;
};

type RulesData = { rules: Rule[] };

export default function AutomationRulesPage() {
  const { data, loading, error } = useFetch<RulesData>("/api/automation-rules");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");

  const rules = data?.rules ?? [];
  const filtered = rules.filter((r) => {
    if (filter === "active" && !r.enabled) return false;
    if (filter === "paused" && r.enabled) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount = rules.filter((r) => r.enabled).length;

  async function toggleRule(id: string, currentEnabled: boolean) {
    await fetch("/api/automation-rules/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !currentEnabled }),
    });
    window.location.reload();
  }

  async function deleteRule(id: string) {
    if (!confirm("Delete this rule? This cannot be undone.")) return;
    await fetch("/api/automation-rules/" + id, { method: "DELETE" });
    window.location.reload();
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-5xl mx-auto">
        <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load rules.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Automation Rules"
        description="Manage your automation rules"
        icon={<Zap className="h-5 w-5" />}
        action={
          <Link
            href="/automation/rules/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Zap className="h-4 w-4" />
            New Rule
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Rules</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{rules.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Active</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Paused</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{rules.length - activeCount}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search rules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
          {(["all", "active", "paused"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={"px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors " + (
                filter === f
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {!filtered.length ? (
        <EmptyState
          title={rules.length === 0 ? "No automation rules yet" : "No rules match your search"}
          description={rules.length === 0 ? "Create your first automation rule to get started." : "Try adjusting your search or filter."}
          icon={<Zap className="h-6 w-6" />}
          action={
            rules.length === 0 ? (
              <Link
                href="/automation/rules/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700"
              >
                Create Rule
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((rule) => (
            <div
              key={rule.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <Link
                      href={"/automation/rules/" + rule.id}
                      className="text-sm font-semibold text-zinc-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400"
                    >
                      {rule.name}
                    </Link>
                    <span
                      className={"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium " + (
                        rule.enabled
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      )}
                    >
                      {rule.enabled ? "Active" : "Paused"}
                    </span>
                  </div>
                  {rule.description && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{rule.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                    <span>
                      Trigger:{" "}
                      <code className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300">
                        {rule.trigger}
                      </code>
                    </span>
                    <span>{rule.conditions.length} conditions</span>
                    <span>{rule.actions.length} actions</span>
                    <span>{rule.executionCount} executions</span>
                    {rule.lastTriggeredAt && (
                      <span>Last: {new Date(rule.lastTriggeredAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleRule(rule.id, rule.enabled)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
                  >
                    {rule.enabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    {rule.enabled ? "Pause" : "Enable"}
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                  <Link
                    href={"/automation/rules/" + rule.id}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
