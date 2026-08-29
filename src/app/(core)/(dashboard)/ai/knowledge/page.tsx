"use client";

import { useState, useEffect } from "react";

type KnowledgeBase = {
  id: string;
  name: string;
  description: string | null;
  documentCount: number;
  createdAt: string;
};

export default function AIKnowledgePage() {
  const [bases, setBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; title: string; content: string; knowledgeBase: string; tags: string[] }[]>([]);
  const [searching, setSearching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    fetch("/api/ai/knowledge")
      .then((r) => r.json())
      .then(setBases)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/ai/knowledge?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch {}
    setSearching(false);
  };

  const createKB = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/ai/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      const kb = await res.json();
      setBases((prev) => [kb, ...prev]);
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
    } catch {}
  };

  if (loading) return <div className="p-8 text-zinc-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
        <button onClick={() => setShowCreate(true)} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Create Knowledge Base
        </button>
      </div>

      <div className="flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Search knowledge base..." className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none" />
        <button onClick={search} disabled={searching} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
          {searching ? "Searching..." : "Search"}
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold">Search Results</h2>
          {searchResults.map((r) => (
            <div key={r.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <h3 className="font-semibold">{r.title}</h3>
              <p className="text-xs text-zinc-500">From: {r.knowledgeBase}</p>
              <p className="mt-2 text-sm text-zinc-600">{r.content}</p>
              {r.tags.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {r.tags.map((t) => (
                    <span key={t} className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 font-semibold">Create Knowledge Base</h2>
          <div className="space-y-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" />
            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button onClick={createKB} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Create</button>
              <button onClick={() => setShowCreate(false)} className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 font-semibold">Knowledge Bases</h2>
        {bases.length === 0 ? (
          <p className="text-sm text-zinc-500">No knowledge bases yet. Create one to get started.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bases.map((kb) => (
              <div key={kb.id} className="rounded-lg border border-zinc-200 bg-white p-4">
                <h3 className="font-semibold">{kb.name}</h3>
                {kb.description && <p className="text-sm text-zinc-500">{kb.description}</p>}
                <p className="mt-2 text-xs text-zinc-500">{kb.documentCount} documents</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
