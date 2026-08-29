"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft } from "lucide-react";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_LABELS: Record<string, string> = { MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday", THURSDAY: "Thursday", FRIDAY: "Friday", SATURDAY: "Saturday", SUNDAY: "Sunday" };

type Conflict = { type: string; message: string };
type Option = { id: string; name: string };

export default function NewSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
  const [rooms, setRooms] = useState<Option[]>([]);
  const [groups, setGroups] = useState<Option[]>([]);
  const [teachers, setTeachers] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/rooms").then((r) => r.json()),
      fetch("/api/groups").then((r) => r.json()),
      fetch("/api/staff").then((r) => r.json()),
      fetch("/api/subjects").then((r) => r.json()),
    ]).then(([rm, gr, st, sub]) => {
      setRooms((rm.rooms ?? []).map((r: Option) => ({ id: r.id, name: r.name })));
      setGroups((gr.groups ?? []).map((g: Option) => ({ id: g.id, name: g.name })));
      const staffList = (st.staff ?? []) as { id: string; role: string; person: { firstName: string; lastName: string } }[];
      setTeachers(staffList.filter((s) => s.role === "TEACHER" || s.role === "TRAINER").map((s) => ({ id: s.id, name: `${s.person.firstName} ${s.person.lastName}` })));
      setSubjects((sub.subjects ?? []).map((s: Option) => ({ id: s.id, name: s.name })));
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConflicts(null);

    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      roomId: form.get("roomId"),
      dayOfWeek: form.get("dayOfWeek"),
      startTime: form.get("startTime"),
      endTime: form.get("endTime"),
      startDate: form.get("startDate") || new Date().toISOString().split("T")[0],
      isRecurring: true,
    };
    if (form.get("groupId")) body.groupId = form.get("groupId");
    if (form.get("teacherId")) body.teacherId = form.get("teacherId");
    if (form.get("subjectId")) body.subjectId = form.get("subjectId");

    if (body.startTime && body.endTime && String(body.startTime) >= String(body.endTime)) {
      setError("End time must be after start time.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 409) {
      const data = await res.json();
      setConflicts(data.conflicts);
      setLoading(false);
      return;
    }

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create session");
      setLoading(false);
      return;
    }

    router.push("/timetable");
  };

  return (
    <div className="animate-fade-in max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg border border-zinc-200 p-2 transition-colors hover:bg-zinc-50">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageHeader title="New Session" description="Schedule a new class session." icon={<span className="text-lg">📅</span>} />
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6">
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {conflicts && conflicts.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">Schedule Conflicts Detected</p>
            <ul className="mt-2 space-y-1">
              {conflicts.map((c, i) => (
                <li key={i} className="text-sm text-amber-700">{c.message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Room *</label>
            <select name="roomId" required className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
              <option value="">Select room...</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Teacher / Trainer</label>
              <select name="teacherId" className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
                <option value="">Select teacher...</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Subject / Course</label>
              <select name="subjectId" className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
                <option value="">Select subject...</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Group / Class</label>
            <select name="groupId" className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
              <option value="">Select group...</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Day of Week *</label>
            <select name="dayOfWeek" required className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
              {DAYS.map((d) => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Start Time *</label>
              <input name="startTime" type="time" required className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">End Time *</label>
              <input name="endTime" type="time" required className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Start Date</label>
            <input name="startDate" type="date" className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50">Cancel</button>
          <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50">
            {loading ? "Creating..." : "Create Session"}
          </button>
        </div>
      </form>
    </div>
  );
}
