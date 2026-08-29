"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFetch } from "@/hooks/use-fetch";
import { PageHeader } from "@/components/dashboard/page-header";
import { Zap, Play, Pause, Trash2, ArrowLeft, Clock, Activity, CheckCircle, XCircle, Settings } from "lucide-react";
import Link from "next/link";

type Condition = { field: string; operator: string; value: unknown };
type Action = { type: string; config: Record<string, unknown> };
type ExecutionLog = {
  id: string;
  eventType: string;
  status: string;
  conditionsMet: boolean;
  error: string | null;
  executedAt: string;
};
type RuleData = {
  rule: {
    id: string;
    name: string;
    description: string | null;
    enabled: boolean;
    trigger: string;
    conditions: Condition[];
    actions: Action[];
    executionCount: number;
    lastTriggeredAt: string | null;
    createdAt: string;
  };
  executions: ExecutionLog[];
};

export default function AutomationRuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ruleId = params.id as string;
  const { data, loading, error } = useFetch<RuleData>("/api/automation-rules/" + ruleId);
  const [toggling, setToggling] = useState(false);

  async function toggleRule() {
    if (!data?.rule) return;
    setToggling(true);
    try {
      await fetch("/api/automation-rules/" + ruleId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !data.rule.enabled }),
      });
      window.location.reload();
    } finally {
      setToggling(false);
    }
  }

  async function deleteRule() {
    if (!confirm("Delete this rule? This cannot be undone.")) return;
    await fetch("/api/automation-rules/" + ruleId, { method: "DELETE" });
    router.push("/automation/rules");
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        <div className="h-10 w-64 bg-zinc-200 rounded animate-pulse" />
        <div className="h-48 bg-zinc-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !data?.rule) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">Failed to load rule.</p>
        </div>
      </div>
    );
  }

  const { rule, executions } = data;

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <PageHeader
        title={rule.name}
        description={rule.description || "Automation rule detail"}
        icon={<Zap className="h-5 w-5" />}
        action={
          <Link href="/automation/rules" className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors">
            <ArrowLeft className="h-4 w-4" />Back to Rules
          </Link>
        }
      />

      <div className="flex items-center gap-3">
        <span className={"inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium " + (rule.enabled ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500")}>
          {rule.enabled ? "Active" : "Paused"}
        </span>
        <button onClick={toggleRule} disabled={toggling} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-colors disabled:opacity-50">
          {rule.enabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {rule.enabled ? "Pause" : "Enable"}
        </button>
        <button onClick={deleteRule} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition-colors">
          <Trash2 className="h-3 w-3" />Delete
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2 text-zinc-500 mb-1"><Clock className="h-4 w-4" /><span className="text-xs font-medium">Trigger</span></div>
          <code className="text-sm font-mono text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">{rule.trigger}</code>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2 text-zinc-500 mb-1"><Activity className="h-4 w-4" /><span className="text-xs font-medium">Executions</span></div>
          <p className="text-lg font-bold text-zinc-900">{rule.executionCount}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2 text-zinc-500 mb-1"><Clock className="h-4 w-4" /><span className="text-xs font-medium">Last Triggered</span></div>
          <p className="text-sm text-zinc-900">{rule.lastTriggeredAt ? new Date(rule.lastTriggeredAt).toLocaleString() : "Never"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2"><Settings className="h-4 w-4" />Conditions ({rule.conditions.length})</h3>
          {rule.conditions.length === 0 ? (
            <p className="text-sm text-zinc-400">No conditions. Rule triggers on every event.</p>
          ) : (
            <div className="space-y-2">
              {rule.conditions.map((c, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 text-sm">
                  <code className="text-zinc-700 font-mono">{c.field}</code>
                  <span className="text-zinc-400">{c.operator}</span>
                  <code className="text-zinc-700 font-mono">{String(c.value)}</code>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2"><Zap className="h-4 w-4" />Actions ({rule.actions.length})</h3>
          {rule.actions.length === 0 ? (
            <p className="text-sm text-zinc-400">No actions configured.</p>
          ) : (
            <div className="space-y-2">
              {rule.actions.map((a, i) => (
                <div key={i} className="p-2 rounded-lg bg-zinc-50 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700">{a.type}</span>
                  </div>
                  {Object.keys(a.config).length > 0 && (
                    <div className="mt-1.5 text-xs text-zinc-500">
                      {Object.entries(a.config).map(([k, v]) => (
                        <div key={k}><span className="text-zinc-400">{k}:</span> {String(v)}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4">Execution History</h3>
        {!executions.length ? (
          <p className="text-sm text-zinc-400 py-4 text-center">No executions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-2 text-xs font-medium text-zinc-500">Status</th>
                  <th className="text-left py-2 text-xs font-medium text-zinc-500">Event</th>
                  <th className="text-left py-2 text-xs font-medium text-zinc-500">Conditions Met</th>
                  <th className="text-left py-2 text-xs font-medium text-zinc-500">Error</th>
                  <th className="text-left py-2 text-xs font-medium text-zinc-500">Time</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((ex) => (
                  <tr key={ex.id} className="border-b border-zinc-100">
                    <td className="py-2.5">
                      {ex.status === "success" ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </td>
                    <td className="py-2.5 font-mono text-xs text-zinc-600">{ex.eventType}</td>
                    <td className="py-2.5">
                      <span className={"text-xs font-medium " + (ex.conditionsMet ? "text-emerald-600" : "text-zinc-400")}>
                        {ex.conditionsMet ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="py-2.5 text-xs text-red-500 max-w-[200px] truncate">{ex.error || "-"}</td>
                    <td className="py-2.5 text-xs text-zinc-500">{new Date(ex.executedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
