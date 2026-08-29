"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

type Group = { id: string; name: string; program: { name: string } | null };
type EnrolledStudent = { id: string; firstName: string; lastName: string };

function TrainingAttendanceInner() {
  const searchParams = useSearchParams();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState(searchParams.get("groupId") ?? "");
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [records, setRecords] = useState<Record<string, string>>({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    fetch("/api/cohorts?limit=100")
      .then((r) => r.json())
      .then((data) => setGroups(data.cohorts ?? []))
      .catch(() => {})
      .finally(() => setLoadingGroups(false));
  }, []);

  useEffect(() => {
    if (!selectedGroup) { setStudents([]); return; }
    setLoadingStudents(true);
    fetch("/api/training-enrollments?cohortId=" + selectedGroup + "&status=ACTIVE&limit=100")
      .then((r) => r.json())
      .then((data) => {
        const items = (data.enrollments ?? []).map((e: Record<string, unknown>) => ({
          id: (e.student as Record<string, unknown>)?.id ?? (e as { studentId: string }).studentId,
          firstName: ((e.student as Record<string, unknown>)?.person as Record<string, unknown>)?.firstName as string ?? "",
          lastName: ((e.student as Record<string, unknown>)?.person as Record<string, unknown>)?.lastName as string ?? "",
        }));
        setStudents(items);
        const initial: Record<string, string> = {};
        items.forEach((s: EnrolledStudent) => { initial[s.id] = "PRESENT"; });
        setRecords(initial);
      })
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, [selectedGroup]);

  const handleSubmit = async () => {
    if (!selectedGroup || students.length === 0) return;
    setSaving(true);
    setError("");
    setSuccess("");
    const attendanceRecords = Object.entries(records).map(([studentId, status]) => ({
      studentId,
      groupId: selectedGroup,
      date,
      status,
    }));
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: attendanceRecords }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save attendance");
        return;
      }
      setSuccess("Attendance saved successfully for " + students.length + " trainees.");
    } catch {
      setError("Failed to save attendance");
    }
    setSaving(false);
  };

  if (loadingGroups) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Training Attendance</h1>
        <p className="mt-1 text-sm text-zinc-500">Mark attendance for training cohort sessions.</p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-64">
          <label className="mb-1 block text-sm font-medium text-zinc-700">Cohort</label>
          <select className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setSuccess(""); setError(""); }}>
            <option value="">Select a cohort</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}{g.program ? " (" + g.program.name + ")" : ""}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Date</label>
          <input type="date" className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {selectedGroup && loadingStudents && <LoadingState />}

      {selectedGroup && !loadingStudents && students.length === 0 && (
        <EmptyState title="No trainees enrolled" description="Select a cohort with active enrollments." />
      )}

      {students.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="pb-2 text-left font-medium text-zinc-500">Trainee</th>
                <th className="pb-2 text-left font-medium text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="py-2 font-medium">{s.firstName} {s.lastName}</td>
                  <td className="py-2">
                    <select className="rounded-lg border border-zinc-200 px-2 py-1 text-xs" value={records[s.id] ?? "PRESENT"} onChange={(e) => setRecords({ ...records, [s.id]: e.target.value })}>
                      <option value="PRESENT">Present</option>
                      <option value="ABSENT">Absent</option>
                      <option value="LATE">Late</option>
                      <option value="EXCUSED">Excused</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex gap-3">
            <button onClick={handleSubmit} disabled={saving} className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrainingAttendancePage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <TrainingAttendanceInner />
      </Suspense>
    </div>
  );
}