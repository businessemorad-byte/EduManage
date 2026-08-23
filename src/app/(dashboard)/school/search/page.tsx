"use client";

import { useState } from "react";
import Link from "next/link";

type SearchResult = {
  type: string;
  id: string;
  name: string;
  detail: string;
  url: string;
};

const TYPE_ICONS: Record<string, string> = {
  student: "S",
  parent: "P",
  teacher: "T",
  class: "C",
  subject: "Sub",
  invoice: "I",
};

const TYPE_COLORS: Record<string, string> = {
  student: "bg-blue-100 text-blue-800",
  parent: "bg-green-100 text-green-800",
  teacher: "bg-purple-100 text-purple-800",
  class: "bg-yellow-100 text-yellow-800",
  subject: "bg-indigo-100 text-indigo-800",
  invoice: "bg-red-100 text-red-800",
};

export default function SchoolSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.length < 2) return;

    setLoading(true);
    setSearched(true);

    const res = await fetch(`/api/school/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      setResults(data.results);
    }
    setLoading(false);
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="mt-1 text-sm text-zinc-500">Search across students, teachers, classes, subjects, and invoices</p>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, code, or invoice number..."
          className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={loading || query.length < 2}
          className="rounded-md bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {!searched ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-500">Enter a search query to find records across the system.</p>
        </div>
      ) : loading ? (
        <div className="py-8 text-center text-zinc-500">Searching...</div>
      ) : results.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-500">No results found for &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-zinc-500">{results.length} results</p>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {results.map((r) => (
              <Link
                key={`${r.type}-${r.id}`}
                href={r.url}
                className="flex items-center gap-4 border-b border-zinc-100 px-4 py-3 last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800/50 dark:hover:bg-zinc-950"
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${TYPE_COLORS[r.type] ?? "bg-gray-100 text-gray-800"}`}>
                  {TYPE_ICONS[r.type] ?? "?"}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.name}</p>
                  {r.detail && <p className="text-xs text-zinc-500">{r.detail}</p>}
                </div>
                <span className="text-xs font-medium capitalize text-zinc-400">{r.type}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
