"use client";

import { useFetch } from "@/hooks/use-fetch";
import Link from "next/link";

type HomeworkItem = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  isPublished: boolean;
  createdAt: string;
  subject: { name: string } | null;
  group: { name: string } | null;
  _count: { submissions: number };
};

export default function HomeworkPage() {
  const { data, loading } = useFetch<{ homeworks: HomeworkItem[]; pagination: { total: number } }>("/api/homework");

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Homework</h1>
        <Link href="/homework/new" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
          Assign Homework
        </Link>
      </div>

      {loading ? (
        <div className="py-8 text-center text-zinc-500">Loading...</div>
      ) : !data?.homeworks.length ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-500">No homework assigned yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.homeworks.map((h) => (
            <div key={h.id} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="text-sm font-semibold">{h.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${h.isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                  {h.isPublished ? "Published" : "Draft"}
                </span>
              </div>
              {h.description && <p className="mb-2 text-sm text-zinc-500 line-clamp-2">{h.description}</p>}
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                {h.subject && <span>{h.subject.name}</span>}
                {h.group && <span>{h.group.name}</span>}
                {h.deadline && <span>Due {new Date(h.deadline).toLocaleDateString()}</span>}
                <span>{h._count.submissions} submissions</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
