"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Calendar, Plus } from "lucide-react";

type Session = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  group: { name: string } | null;
  teacher: { staff: { person: { firstName: string; lastName: string } } } | null;
  room: { name: string };
  subject: { name: string } | null;
  module: { name: string } | null;
};

type Option = { id: string; name: string };

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_FULL: Record<string, string> = {
  MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday", FRIDAY: "Friday", SATURDAY: "Saturday", SUNDAY: "Sunday",
};
const COLORS = [
  { border: "border-l-blue-500", bg: "bg-blue-50", text: "text-blue-800", sub: "text-blue-600/70" },
  { border: "border-l-emerald-500", bg: "bg-emerald-50", text: "text-emerald-800", sub: "text-emerald-600/70" },
  { border: "border-l-violet-500", bg: "bg-violet-50", text: "text-violet-800", sub: "text-violet-600/70" },
  { border: "border-l-amber-500", bg: "bg-amber-50", text: "text-amber-800", sub: "text-amber-600/70" },
  { border: "border-l-rose-500", bg: "bg-rose-50", text: "text-rose-800", sub: "text-rose-600/70" },
  { border: "border-l-cyan-500", bg: "bg-cyan-50", text: "text-cyan-800", sub: "text-cyan-600/70" },
];

export function TimetableGrid() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Option[]>([]);
  const [rooms, setRooms] = useState<Option[]>([]);
  const [groups, setGroups] = useState<Option[]>([]);
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [filterGroup, setFilterGroup] = useState("");

  const fetchSessions = useCallback(() => {
    const params = new URLSearchParams();
    if (filterTeacher) params.set("teacherId", filterTeacher);
    if (filterRoom) params.set("roomId", filterRoom);
    if (filterGroup) params.set("groupId", filterGroup);
    const qs = params.toString();
    setLoading(true);
    fetch(`/api/timetable${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterTeacher, filterRoom, filterGroup]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  useEffect(() => {
    Promise.all([
      fetch("/api/staff").then((r) => r.json()),
      fetch("/api/rooms").then((r) => r.json()),
      fetch("/api/groups").then((r) => r.json()),
    ]).then(([s, rm, gr]) => {
      const staff = (s.staff ?? []) as { id: string; role: string; person: { firstName: string; lastName: string } }[];
      setTeachers(staff.filter((st) => st.role === "TEACHER" || st.role === "TRAINER").map((st) => ({ id: st.id, name: `${st.person.firstName} ${st.person.lastName}` })));
      setRooms((rm.rooms ?? []).map((r: { id: string; name: string }) => ({ id: r.id, name: r.name })));
      setGroups((gr.groups ?? []).map((g: { id: string; name: string }) => ({ id: g.id, name: g.name })));
    }).catch(() => {});
  }, []);

  if (loading && sessions.length === 0) return <LoadingState />;

  const byDay = DAYS.reduce<Record<string, Session[]>>((acc, day) => {
    acc[day] = sessions.filter((s) => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {});

  const subjectNames = [...new Set(sessions.map((s) => s.subject?.name ?? s.module?.name ?? "").filter(Boolean))];
  const hasFilters = filterTeacher || filterRoom || filterGroup;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
          <option value="">All Teachers</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
          <option value="">All Rooms</option>
          {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
          <option value="">All Groups</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        {hasFilters && (
          <button onClick={() => { setFilterTeacher(""); setFilterRoom(""); setFilterGroup(""); }} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Clear</button>
        )}
        <div className="ml-auto">
          <a href="/sessions/new" className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700">
            <Plus className="h-4 w-4" /> New Session
          </a>
        </div>
      </div>

      {sessions.length === 0 ? (
        <EmptyState icon={<Calendar className="h-7 w-7" />} title="No sessions scheduled" description="Create sessions to build your timetable." action={<a href="/sessions/new" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">+ New Session</a>} />
      ) : (
        <div className="overflow-x-auto">
          <div className="grid min-w-[1000px] grid-cols-7 gap-px rounded-xl border border-zinc-200 bg-zinc-200">
            {DAYS.map((day) => (
              <div key={day} className="min-h-[160px] bg-white">
                <div className="sticky top-0 border-b border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {DAY_FULL[day]}
                </div>
                <div className="space-y-1.5 p-2">
                  {byDay[day]?.map((s) => {
                    const name = s.subject?.name ?? s.module?.name ?? "";
                    const ci = subjectNames.indexOf(name) >= 0 ? subjectNames.indexOf(name) % COLORS.length : 0;
                    const c = COLORS[ci];
                    return (
                      <div key={s.id} onClick={() => router.push(`/sessions/${s.id}`)} className={`cursor-pointer rounded-lg border-l-4 p-2.5 text-xs transition-shadow hover:shadow-md ${c.border} ${c.bg}`}>
                        <div className={`font-semibold ${c.text}`}>{s.startTime} – {s.endTime}</div>
                        <div className={`mt-1 font-medium ${c.text}`}>{name || "—"}</div>
                        {s.teacher && <div className={c.sub}>{s.teacher.staff.person.firstName} {s.teacher.staff.person.lastName}</div>}
                        <div className={c.sub}>{s.room.name}{s.group ? ` · ${s.group.name}` : ""}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
