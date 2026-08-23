"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LoadingState } from "@/components/ui/loading-state";

type Student = { id: string; person: { firstName: string; lastName: string } };
type Program = { id: string; name: string };
type Cohort = { id: string; name: string; programId: string; capacity: number | null; cohortStatus: string | null };

export default function EnrollTraineePage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedCohortId, setSelectedCohortId] = useState("");

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    return s.person.firstName.toLowerCase().includes(q) || s.person.lastName.toLowerCase().includes(q);
  });

  const filteredCohorts = cohorts.filter((c) => c.programId === selectedProgramId && c.cohortStatus !== "ARCHIVED" && c.cohortStatus !== "CANCELED");

  useEffect(() => {
    Promise.all([
      fetch("/api/students?limit=500").then((r) => r.json()),
      fetch("/api/training-programs?limit=100").then((r) => r.json()),
      fetch("/api/cohorts?limit=500").then((r) => r.json()),
    ])
      .then(([sData, pData, cData]) => {
        setStudents(sData.students ?? []);
        setPrograms(pData.programs ?? []);
        setCohorts(cData.cohorts ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedProgramId) {
      setError("Please select a student and a program.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/training-enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enroll",
          studentId: selectedStudentId,
          programId: selectedProgramId,
          cohortId: selectedCohortId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to enroll trainee");
        return;
      }
      setSuccess("Trainee enrolled successfully.");
      setTimeout(() => router.push("/trainees"), 1500);
    } catch {
      setError("Failed to enroll trainee");
    }
    setSaving(false);
  };

  if (loading) return <LoadingState />;

  const inputCls = "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

  return (
    <div className="p-8">
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enroll Trainee</h1>
          <p className="mt-1 text-sm text-zinc-500">Enroll a student into a training program and optional cohort.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
          {success && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">{success}</div>}

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Search Student</label>
            <input className={inputCls} value={studentSearch} onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudentId(""); }} placeholder="Type student name..." />
            {studentSearch && !selectedStudentId && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                {filteredStudents.slice(0, 20).map((s) => (
                  <button key={s.id} type="button" onClick={() => { setSelectedStudentId(s.id); setStudentSearch(`${s.person.firstName} ${s.person.lastName}`); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    {s.person.firstName} {s.person.lastName}
                  </button>
                ))}
                {filteredStudents.length === 0 && <p className="px-3 py-2 text-xs text-zinc-500">No students found</p>}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Program *</label>
            <select className={inputCls} value={selectedProgramId} onChange={(e) => { setSelectedProgramId(e.target.value); setSelectedCohortId(""); }} required>
              <option value="">Select a program</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Cohort (optional)</label>
            <select className={inputCls} value={selectedCohortId} onChange={(e) => setSelectedCohortId(e.target.value)}>
              <option value="">No cohort (standalone enrollment)</option>
              {filteredCohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.capacity ? `(${c.cohortStatus ?? "OPEN"})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
              {saving ? "Enrolling..." : "Enroll Trainee"}
            </button>
            <button type="button" onClick={() => router.back()} className="rounded-lg border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
