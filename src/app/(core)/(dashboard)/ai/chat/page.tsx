"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";

type Conversation = {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

type Message = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

export default function AIChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/ai/chat")
      .then((r) => r.json())
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadConversation = async (id: string) => {
    setActiveConversation(id);
    const res = await fetch(`/api/ai/chat?conversationId=${id}`);
    const data = await res.json();
    setMessages(data.messages ?? []);
  };

  const createConversation = async () => {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create" }),
    });
    const conv = await res.json();
    setConversations((prev) => [conv, ...prev]);
    setActiveConversation(conv.id);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeConversation || sending) return;
    const msg = input.trim();
    setInput("");
    setSending(true);

    // Optimistic add
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: msg,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConversation, message: msg }),
      });
      const data = await res.json();
      if (data.content) {
        setMessages((prev) => [
          ...prev,
          { id: `resp-${Date.now()}`, role: "assistant", content: data.content, createdAt: new Date().toISOString() },
        ]);
      }
    } catch {
      // error handling
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="w-64 shrink-0 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-3">
        <button onClick={createConversation} className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          New Chat
        </button>
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => loadConversation(c.id)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-100 ${
              activeConversation === c.id ? "bg-zinc-100" : ""
            }`}
          >
            <p className="font-medium truncate">{c.title ?? "New Chat"}</p>
            <p className="text-xs text-zinc-500">{c.messageCount} messages</p>
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col rounded-lg border border-zinc-200 bg-white">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-zinc-500">
              <p>Start a conversation with the AI assistant.</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                m.role === "user"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-900"
              }`}>
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-200 p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask about your data..."
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !activeConversation}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {sending ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
