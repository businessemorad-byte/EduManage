"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFetch } from "@/hooks/use-fetch";

type Subject = { id: string; name: string };
type Group = { id: string; name: string };

export default function NewHomeworkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: subjects } = useFetch<{ subjects: Subject[] }>("/api/subjects");
  const { data: groups } = useFetch<{ groups: Group[] }>("/api/groups");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description") || undefined,
        instructions: form.get("instructions") || undefined,
        subjectId: form.get("subjectId") || undefined,
        groupId: form.get("groupId") || undefined,
        deadline: form.get("deadline") || undefined,
        maxScore: form.get("maxScore") ? Number(form.get("maxScore")) : undefined,
        isPublished: form.get("isPublished") === "on",
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create homework");
      setLoading(false);
      return;
    }

    router.push("/homework");
  }

  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="text-2xl font-bold tracking-tight">Assign Homework</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Title *</label>
          <input name="title" required className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
          <textarea name="description" rows={2} className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Instructions</label>
          <textarea name="instructions" rows={3} className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Subject</label>
            <select name="subjectId" className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              <option value="">— Select —</option>
              {subjects?.subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Group</label>
            <select name="groupId" className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              <option value="">— Select —</option>
              {groups?.groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Deadline</label>
            <input name="deadline" type="datetime-local" className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Max Score</label>
            <input name="maxScore" type="number" min="1" defaultValue={100} className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input name="isPublished" type="checkbox" defaultChecked className="h-4 w-4 rounded border-zinc-300" />
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Publish immediately</label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Assigning..." : "Assign Homework"}
        </button>
      </form>
    </div>
  );
}
