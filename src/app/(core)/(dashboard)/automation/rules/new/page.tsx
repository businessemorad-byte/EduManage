"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Zap, Plus, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

const EVENT_TYPES = [
  { label: "Student Created", value: "student.created" },
  { label: "Student Enrolled", value: "student.enrolled" },
  { label: "Student Absent", value: "student.absent" },
  { label: "Student Late", value: "student.late" },
  { label: "Payment Created", value: "payment.created" },
  { label: "Payment Overdue", value: "payment.overdue" },
  { label: "Invoice Created", value: "invoice.created" },
  { label: "Session Created", value: "session.created" },
  { label: "Teacher Absent", value: "teacher.absent" },
  { label: "Admission Created", value: "admission.created" },
  { label: "Admission Accepted", value: "admission.accepted" },
  { label: "Admission Rejected", value: "admission.rejected" },
  { label: "Report Card Finalized", value: "report_card.finalized" },
  { label: "Homework Assigned", value: "homework.assigned" },
  { label: "Announcement Published", value: "announcement.published" },
  { label: "Student Promoted", value: "student.promoted" },
  { label: "Lead Created", value: "lead.created" },
  { label: "Lead Converted", value: "lead.converted" },
  { label: "Trial Scheduled", value: "trial.scheduled" },
  { label: "Enrollment Created", value: "enrollment.created" },
  { label: "Student Paused", value: "student.paused" },
  { label: "Student Dropped", value: "student.dropped" },
];

const OPERATORS = ["eq", "neq", "gt", "gte", "lt", "lte", "contains", "in"];

const ACTION_TYPES = [
  { label: "Notification", value: "notification" },
  { label: "Audit Log", value: "audit" },
  { label: "Set Field", value: "set_field" },
  { label: "Email", value: "email" },
  { label: "SMS", value: "sms" },
  { label: "In-App Message", value: "in_app" },
];

const inputCls = "w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500";
const selectCls = "w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500";

export default function CreateAutomationRulePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", trigger: "" });
  const [conditions, setConditions] = useState([{ field: "", operator: "eq", value: "" }]);
  const [actions, setActions] = useState<Array<{ type: string; config: Record<string, string> }>>([{ type: "notification", config: { title: "", body: "" } }]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.trigger) return;
    setSaving(true);
    try {
      const res = await fetch("/api/automation-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          conditions: conditions.filter((c) => c.field),
          actions: actions.filter((a) => a.type),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push("/automation/rules/" + data.rule.id);
      }
    } finally {
      setSaving(false);
    }
  }

  function addCondition() { setConditions([...conditions, { field: "", operator: "eq", value: "" }]); }
  function removeCondition(i: number) { setConditions(conditions.filter((_, idx) => idx !== i)); }
  function updateCondition(i: number, key: string, val: string) {
    const u = [...conditions]; u[i] = { ...u[i], [key]: val }; setConditions(u);
  }
  function addAction() { setActions([...actions, { type: "notification", config: { title: "", body: "" } }]); }
  function removeAction(i: number) { setActions(actions.filter((_, idx) => idx !== i)); }
  function updateActionType(i: number, type: string) {
    const u = [...actions];
    const cfg: Record<string, string> = type === "notification" ? { title: "", body: "" } : type === "email" ? { to: "", subject: "", body: "" } : type === "sms" ? { to: "", message: "" } : type === "set_field" ? { target: "", field: "", value: "" } : {};
    u[i] = { type, config: cfg }; setActions(u);
  }
  function updateActionConfig(i: number, key: string, val: string) {
    const u = [...actions]; u[i] = { ...u[i], config: { ...u[i].config, [key]: val } }; setActions(u);
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <PageHeader title="Create Automation Rule" description="Set up a new automation rule" icon={<Zap className="h-5 w-5" />}
        action={<Link href="/automation/rules" className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"><ArrowLeft className="h-4 w-4" />Back to Rules</Link>}
      />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Basic Information</h2>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Rule Name *</label>
            <input type="text" required placeholder="e.g. Notify on new student" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description</label>
            <textarea placeholder="Optional description..." rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Trigger Event *</label>
            <select required value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} className={selectCls}>
              <option value="">Select an event...</option>
              {EVENT_TYPES.map((et) => (<option key={et.value} value={et.value}>{et.label}</option>))}
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Conditions (Optional)</h2>
            <button type="button" onClick={addCondition} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"><Plus className="h-3 w-3" />Add</button>
          </div>
          {conditions.map((c, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input placeholder="field" value={c.field} onChange={(e) => updateCondition(i, "field", e.target.value)} className={inputCls + " flex-1"} />
              <select value={c.operator} onChange={(e) => updateCondition(i, "operator", e.target.value)} className={selectCls + " w-28"}>
                {OPERATORS.map((op) => (<option key={op} value={op}>{op}</option>))}
              </select>
              <input placeholder="value" value={c.value} onChange={(e) => updateCondition(i, "value", e.target.value)} className={inputCls + " flex-1"} />
              {conditions.length > 1 && (<button type="button" onClick={() => removeCondition(i)} className="p-2 text-zinc-400 hover:text-red-500"><X className="h-4 w-4" /></button>)}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Actions</h2>
            <button type="button" onClick={addAction} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"><Plus className="h-3 w-3" />Add</button>
          </div>
          {actions.map((a, i) => (
            <div key={i} className="space-y-2 p-3 rounded-lg bg-zinc-50">
              <div className="flex gap-2 items-center">
                <select value={a.type} onChange={(e) => updateActionType(i, e.target.value)} className={selectCls + " flex-1"}>
                  {ACTION_TYPES.map((at) => (<option key={at.value} value={at.value}>{at.label}</option>))}
                </select>
                {actions.length > 1 && (<button type="button" onClick={() => removeAction(i)} className="p-2 text-zinc-400 hover:text-red-500"><X className="h-4 w-4" /></button>)}
              </div>
              {a.type === "notification" && (
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Title" value={a.config.title || ""} onChange={(e) => updateActionConfig(i, "title", e.target.value)} className={inputCls} />
                  <input placeholder="Body" value={a.config.body || ""} onChange={(e) => updateActionConfig(i, "body", e.target.value)} className={inputCls} />
                </div>
              )}
              {a.type === "email" && (
                <div className="space-y-2">
                  <input placeholder="To (email)" value={a.config.to || ""} onChange={(e) => updateActionConfig(i, "to", e.target.value)} className={inputCls} />
                  <input placeholder="Subject" value={a.config.subject || ""} onChange={(e) => updateActionConfig(i, "subject", e.target.value)} className={inputCls} />
                  <textarea placeholder="Body" rows={2} value={a.config.body || ""} onChange={(e) => updateActionConfig(i, "body", e.target.value)} className={inputCls} />
                </div>
              )}
              {a.type === "sms" && (
                <div className="space-y-2">
                  <input placeholder="To (phone)" value={a.config.to || ""} onChange={(e) => updateActionConfig(i, "to", e.target.value)} className={inputCls} />
                  <input placeholder="Message" value={a.config.message || ""} onChange={(e) => updateActionConfig(i, "message", e.target.value)} className={inputCls} />
                </div>
              )}
              {a.type === "set_field" && (
                <div className="grid grid-cols-3 gap-2">
                  <input placeholder="Target" value={a.config.target || ""} onChange={(e) => updateActionConfig(i, "target", e.target.value)} className={inputCls} />
                  <input placeholder="Field" value={a.config.field || ""} onChange={(e) => updateActionConfig(i, "field", e.target.value)} className={inputCls} />
                  <input placeholder="Value" value={a.config.value || ""} onChange={(e) => updateActionConfig(i, "value", e.target.value)} className={inputCls} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/automation/rules" className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors">Cancel</Link>
          <button type="submit" disabled={saving || !form.name || !form.trigger} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? "Creating..." : "Create Rule"}
          </button>
        </div>
      </form>
    </div>
  );
}
