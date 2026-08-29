"use client";

import { useFetch } from "@/hooks/use-fetch";

type Promotion = {
  id: string;
  status: string;
  reason: string | null;
  createdAt: string;
  student: { person: { firstName: string; lastName: string } };
  fromAcademicYear: { name: string } | null;
  toAcademicYear: { name: string } | null;
  fromGroup: { name: string } | null;
  toGroup: { name: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  PROMOTED: "bg-green-100 text-green-800",
  REPEAT: "bg-red-100 text-red-800",
  CONDITIONAL: "bg-yellow-100 text-yellow-800",
  PENDING: "bg-blue-100 text-blue-800",
};

export default function PromotionsPage() {
  const { data, loading } = useFetch<{ promotions: Promotion[]; pagination: { total: number } }>("/api/promotions");

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promotions</h1>
        <span className="text-sm text-zinc-500">{data?.pagination.total ?? 0} records</span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-zinc-500">Loading...</div>
      ) : !data?.promotions.length ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="text-zinc-500">No promotions recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">To</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.promotions.map((p) => (
                <tr key={p.id} className="border-b border-zinc-100">
                  <td className="px-4 py-3 text-sm font-medium">
                    {p.student.person.firstName} {p.student.person.lastName}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-800"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {p.fromAcademicYear?.name ?? "—"}
                    {p.fromGroup ? ` · ${p.fromGroup.name}` : ""}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {p.toAcademicYear?.name ?? "—"}
                    {p.toGroup ? ` · ${p.toGroup.name}` : ""}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{p.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
