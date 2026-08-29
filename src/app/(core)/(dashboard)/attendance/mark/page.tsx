"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type Student = { id: string; person: { firstName: string; lastName: string } };
type Group = { id: string; name: string };

export default function MarkAttendancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/students").then((r) => r.json()).then((d) => setStudents(d.students ?? []));
    fetch("/api/groups").then((r) => r.json()).then((d) => setGroups(d.groups ?? []));
  }, []);

  function setStatus(studentId: string, status: string) {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const date = form.get("date") as string;
    const groupId = form.get("groupId") as string;

    const records = Object.entries(attendance)
      .filter(([, status]) => status)
      .map(([studentId, status]) => ({
        studentId,
        date,
        groupId: groupId || undefined,
        status,
      }));

    if (records.length === 0) {
      setError("Mark at least one student");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to record attendance");
      setLoading(false);
      return;
    }

    router.push("/attendance");
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold tracking-tight">Mark Attendance</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Date</label>
            <input name="date" type="date" required className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Group (optional)</label>
            <select name="groupId" className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm">
              <option value="">All students</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        {students.length === 0 ? (
          <p className="text-sm text-zinc-500">No students found.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-500">Student</th>
                  <th className="px-4 py-3 font-medium text-zinc-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium">
                      {s.person.firstName} {s.person.lastName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {["PRESENT", "ABSENT", "LATE", "EXCUSED"].map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setStatus(s.id, status)}
                            className={`rounded px-2 py-1 text-xs font-medium ${
                              attendance[s.id] === status
                                ? status === "PRESENT" ? "bg-emerald-100 text-emerald-700"
                                  : status === "ABSENT" ? "bg-red-100 text-red-700"
                                  : status === "LATE" ? "bg-amber-100 text-amber-700"
                                  : "bg-blue-100 text-blue-700"
                                : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {status.charAt(0)}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Attendance"}
        </button>
      </form>
    </div>
  );
}
