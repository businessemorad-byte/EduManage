"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { FileOutput, Plus, Pencil, Copy, Archive, X, Eye } from "lucide-react";

type Template = {
  id: string;
  name: string;
  code: string;
  channel: string;
  language: string;
  subject: string | null;
  body: string;
  status: string;
  isSystem: boolean;
  variables: string[] | null;
  createdAt: string;
};

const AVAILABLE_VARIABLES = [
  { name: "firstName", desc: "Recipient first name" },
  { name: "lastName", desc: "Recipient last name" },
  { name: "organizationName", desc: "Organization name" },
  { name: "programName", desc: "Program name" },
  { name: "courseName", desc: "Course/module name" },
  { name: "sessionDate", desc: "Session date" },
  { name: "sessionTime", desc: "Session time" },
  { name: "amount", desc: "Payment amount" },
  { name: "invoiceNumber", desc: "Invoice number" },
  { name: "dueDate", desc: "Payment due date" },
  { name: "grade", desc: "Grade/score" },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Template | null>(null);
  const [showVars, setShowVars] = useState(false);

  const [form, setForm] = useState({ name: "", code: "", channel: "IN_APP", language: "en", subject: "", body: "", status: "ACTIVE" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/communication/templates")
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = templates.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.subject?.toLowerCase().includes(q);
  });

  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({ name: t.name, code: t.code, channel: t.channel, language: t.language, subject: t.subject ?? "", body: t.body, status: t.status });
    setError("");
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", code: "", channel: "IN_APP", language: "en", subject: "", body: "", status: "ACTIVE" });
    setError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.body.trim()) { setError("Name and body are required."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/communication/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { action: "update", id: editing.id, ...form } : form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed to save"); setSaving(false); return; }
      const data = await res.json();
      if (editing) {
        setTemplates((prev) => prev.map((t) => t.id === editing.id ? { ...t, ...form } : t));
      } else {
        setTemplates((prev) => [data.template ?? { id: "new", ...form, isSystem: false, createdAt: new Date().toISOString(), variables: null }, ...prev]);
      }
      setEditing(null);
    } catch { setError("Failed to save template"); }
    setSaving(false);
  };

  const archiveTemplate = async (id: string) => {
    await fetch("/api/communication/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", id, status: "ARCHIVED" }) });
    setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, status: "ARCHIVED" } : t));
  };

  const duplicateTemplate = async (t: Template) => {
    try {
      const res = await fetch("/api/communication/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${t.name} (Copy)`, code: `${t.code}_copy`, channel: t.channel, language: t.language, subject: t.subject, body: t.body, status: "ACTIVE" }),
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates((prev) => [data.template ?? { ...t, id: "new", name: `${t.name} (Copy)`, code: `${t.code}_copy`, isSystem: false, createdAt: new Date().toISOString() }, ...prev]);
      }
    } catch {}
  };

  if (loading) return <LoadingState />;

  const inputCls = "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileOutput className="h-5 w-5 text-zinc-500" />
          <h1 className="text-2xl font-bold tracking-tight">Communication Templates</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowVars(!showVars)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300">
            <Eye className="mr-1 inline h-4 w-4" /> Variables
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900">
            <Plus className="h-4 w-4" /> Add Template
          </button>
        </div>
      </div>

      {showVars && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="mb-2 text-sm font-semibold">Available Template Variables</h3>
          <p className="mb-3 text-xs text-zinc-500">Use double curly braces: {"{{firstName}}"}, {"{{lastName}}"}, etc.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {AVAILABLE_VARIABLES.map((v) => (
              <div key={v.name} className="rounded-md bg-zinc-50 px-3 py-1.5 text-xs dark:bg-zinc-900">
                <code className="font-mono text-violet-600 dark:text-violet-400">{"{{" + v.name + "}}"}</code>
                <span className="ml-1 text-zinc-500">{v.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(editing !== null || form.name) && (
        <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{editing ? "Edit Template" : "New Template"}</h3>
            <button onClick={() => { setEditing(null); setForm({ name: "", code: "", channel: "IN_APP", language: "en", subject: "", body: "", status: "ACTIVE" }); }} className="text-zinc-400 hover:text-zinc-600"><X className="h-4 w-4" /></button>
          </div>
          {error && <div className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Name *</label><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Code</label><input className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="PAYMENT_REMINDER" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Channel</label>
                <select className={inputCls} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                  <option value="IN_APP">In-App</option><option value="EMAIL">Email</option><option value="SMS">SMS</option>
                </select>
              </div>
              <div><label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Language</label>
                <select className={inputCls} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                  <option value="en">English</option><option value="ar">Arabic</option><option value="fr">French</option>
                </select>
              </div>
              <div><label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Status</label>
                <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            <div><label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Subject</label><input className={inputCls} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Optional subject line" /></div>
            <div><label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Body *</label><textarea rows={5} className={inputCls} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required /></div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">{saving ? "Saving..." : "Save Template"}</button>
              <button type="button" onClick={() => { setEditing(null); setForm({ name: "", code: "", channel: "IN_APP", language: "en", subject: "", body: "", status: "ACTIVE" }); }} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="w-72">
        <input className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-3 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No templates" description="Create templates for emails, SMS, and in-app messages." />
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">{t.name}</h3>
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">{t.channel}</span>
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">{t.language}</span>
                  {t.isSystem && <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">System</span>}
                </div>
                {t.subject && <p className="mt-1 text-sm text-zinc-500">Subject: {t.subject}</p>}
                <p className="mt-1 text-xs text-zinc-500 line-clamp-1">{t.body}</p>
                <p className="mt-1 text-xs text-zinc-400">Code: {t.code}</p>
              </div>
              <div className="ml-4 flex items-center gap-1">
                <StatusBadge status={t.status} />
                <button onClick={() => openEdit(t)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => duplicateTemplate(t)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
                {!t.isSystem && <button onClick={() => archiveTemplate(t.id)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Archive"><Archive className="h-3.5 w-3.5" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
