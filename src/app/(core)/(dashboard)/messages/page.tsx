"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageSquare, Send, X } from "lucide-react";

type Message = {
  id: string;
  senderId: string;
  senderType: string;
  recipientId: string;
  recipientType: string;
  subject: string | null;
  content: string;
  read: boolean;
  createdAt: string;
};

type StaffOption = { id: string; name: string; type: string };

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"inbox" | "sent">("inbox");
  const [composing, setComposing] = useState(false);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const [composeForm, setComposeForm] = useState({ recipientId: "", subject: "", content: "" });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");

  useEffect(() => {
    setLoading(true);
    const action = tab === "sent" ? "sentOnly=true" : "";
    fetch(`/api/communication/messages?${action}`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    if (composing && staff.length === 0) {
      fetch("/api/staff?limit=500")
        .then((r) => r.json())
        .then((data) => {
          setStaff((data.staff ?? []).map((s: { id: string; role: string; person: { firstName: string; lastName: string } }) => ({
            id: s.id,
            name: `${s.person.firstName} ${s.person.lastName}`,
            type: "STAFF",
          })));
        })
        .catch(() => {});
    }
  }, [composing, staff.length]);

  const markRead = async (id: string) => {
    await fetch("/api/communication/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", messageId: id }),
    });
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeForm.recipientId || !composeForm.content.trim()) {
      setSendError("Recipient and message are required.");
      return;
    }
    setSending(true);
    setSendError("");
    setSendSuccess("");
    try {
      const res = await fetch("/api/communication/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: composeForm.recipientId,
          subject: composeForm.subject || undefined,
          content: composeForm.content,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSendError(data.error || "Failed to send message");
        return;
      }
      setSendSuccess("Message sent successfully.");
      setComposeForm({ recipientId: "", subject: "", content: "" });
      setTimeout(() => { setComposing(false); setSendSuccess(""); }, 1500);
    } catch {
      setSendError("Failed to send message");
    }
    setSending(false);
  };

  if (loading) return <LoadingState />;

  const inputCls = "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-zinc-500" />
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        </div>
        <button onClick={() => { setComposing(true); setSelectedMessage(null); }} className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          <Send className="h-4 w-4" /> Compose
        </button>
      </div>

      <div className="flex gap-2 border-b border-zinc-200">
        {(["inbox", "sent"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setSelectedMessage(null); setComposing(false); }} className={`border-b-2 px-4 py-2 text-sm font-medium capitalize ${tab === t ? "border-zinc-900" : "border-transparent text-zinc-500"}`}>
            {t}
          </button>
        ))}
      </div>

      {composing && (
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Compose Message</h3>
            <button onClick={() => setComposing(false)} className="text-zinc-400 hover:text-zinc-600"><X className="h-4 w-4" /></button>
          </div>
          {sendError && <div className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{sendError}</div>}
          {sendSuccess && <div className="mb-3 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">{sendSuccess}</div>}
          <form onSubmit={handleSend} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Recipient *</label>
              <select className={inputCls} value={composeForm.recipientId} onChange={(e) => setComposeForm({ ...composeForm, recipientId: e.target.value })} required>
                <option value="">Select a recipient</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Subject</label>
              <input className={inputCls} value={composeForm.subject} onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })} placeholder="Optional subject" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Message *</label>
              <textarea rows={4} className={inputCls} value={composeForm.content} onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })} placeholder="Type your message..." required />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={sending} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
                {sending ? "Sending..." : "Send Message"}
              </button>
              <button type="button" onClick={() => setComposing(false)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!composing && selectedMessage && (
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{selectedMessage.subject ?? "No subject"}</h3>
            <button onClick={() => setSelectedMessage(null)} className="text-zinc-400 hover:text-zinc-600"><X className="h-4 w-4" /></button>
          </div>
          <div className="mb-2 flex gap-3 text-xs text-zinc-500">
            <span>From: {selectedMessage.senderType}</span>
            <span>To: {selectedMessage.recipientType}</span>
            <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-zinc-700">{selectedMessage.content}</p>
          <div className="mt-4">
            <button onClick={() => { setComposing(true); setSelectedMessage(null); }} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Reply
            </button>
          </div>
        </div>
      )}

      {!composing && !selectedMessage && messages.length === 0 && (
        <EmptyState title="No messages" description={tab === "inbox" ? "Your inbox is empty." : "You haven't sent any messages."} />
      )}

      {!composing && !selectedMessage && messages.length > 0 && (
        <div className="space-y-2">
          {messages.map((m) => (
            <div
              key={m.id}
              onClick={() => { if (!m.read && tab === "inbox") markRead(m.id); setSelectedMessage({ ...m, read: true }); setMessages((prev) => prev.map((msg) => msg.id === m.id ? { ...msg, read: true } : msg)); }}
              className={`cursor-pointer rounded-lg border px-4 py-3 transition-colors ${
                m.read ? "border-zinc-200 bg-white hover:bg-zinc-50" : "border-blue-200 bg-blue-50/50 hover:bg-blue-50"
              }`}
            >
              <div className="flex items-center gap-2">
                {!m.read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                {m.subject && <h3 className="text-sm font-medium">{m.subject}</h3>}
                <span className="text-xs text-zinc-500">{tab === "inbox" ? `From: ${m.senderType}` : `To: ${m.recipientType}`}</span>
                <span className="ml-auto text-xs text-zinc-500">{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-600 line-clamp-2">{m.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
