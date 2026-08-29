"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Activity, Filter, CheckCircle, XCircle, Clock } from "lucide-react";

type LogEntry = {
  id: string;
  ruleId: string;
  ruleName: string;
  trigger: string;
  eventType: string;
  status: string;
  error: string | null;
  conditionsMet: boolean;
  actionsExecuted: unknown;
  executedAt: string;
};

type LogsData = { logs: LogEntry[] };

export default function AutomationLogsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const url = "/api/automation/logs" + (statusFilter ? "?status=" + statusFilter : "");
  const { data, loading, error } = useFetch<LogsData>(url);

  const logs = data?.logs ?? [];

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-5xl mx-auto">
        <div className="h-10 w-48 bg-zinc-200 rounded animate-pulse" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">Failed to load execution logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Activity Log"
        description="View all automation rule executions"
        icon={<Activity className="h-5 w-5" />}
      />

      <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 w-fit">
        {[
          { label: "All", value: "" },
          { label: "Success", value: "success" },
          { label: "Error", value: "error" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={"px-3 py-1.5 text-xs font-medium rounded-md transition-colors " + (
              statusFilter === f.value
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!logs.length ? (
        <EmptyState
          title="No execution logs"
          description="Activity from your automation rules will appear here."
          icon={<Activity className="h-6 w-6" />}
        />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Rule</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Event Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Conditions</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Error</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">
                      {log.status === "success" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <CheckCircle className="h-3 w-3" />Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                          <XCircle className="h-3 w-3" />Error
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900">{log.ruleName}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono px-1.5 py-0.5 bg-zinc-100 rounded text-zinc-600">{log.eventType}</code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={"text-xs font-medium " + (log.conditionsMet ? "text-emerald-600" : "text-zinc-400")}>
                        {log.conditionsMet ? "Met" : "Not Met"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-red-500 max-w-[200px] truncate">{log.error || "-"}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.executedAt).toLocaleString()}
                    </td>
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
