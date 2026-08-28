"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft, CalendarDays, User, Users, Building2, Clock, BookOpen, Trash2, Pencil, Save, X, GraduationCap, Layers, Link as LinkIcon } from "lucide-react";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday", FRIDAY: "Friday", SATURDAY: "Saturday", SUNDAY: "Sunday",
};

type Option = { id: string; name: string };

type SessionDetail = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string | null;
  isRecurring: boolean;
  isActive: boolean;
  group: { id: string; name: string } | null;
  teacher: { id: string; staff: { person: { firstName: string; lastName: string } } } | null;
  room: { id: string; name: string; capacity: number } | null;
  subject: { id: string; name: string } | null;
  module: { id: string; name: string; program: { id: string; name: string } | null } | null;
  schedule: { id: string; name: string } | null;
};

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conflicts, setConflicts] = useState<string[] | null>(null);

  const [rooms, setRooms] = useState<Option[]>([]);
  const [groups, setGroups] = useState<Option[]>([]);
  const [teachers, setTeachers] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);

  const [editRoomId, setEditRoomId] = useState("");
  const [editGroupId, setEditGroupId] = useState("");
  const [editTeacherId, setEditTeacherId] = useState("");
  const [editSubjectId, setEditSubjectId] = useState("");
  const [editDay, setEditDay] = useState("MONDAY");
  const [editStart, setEditStart] = useState("08:00");
  const [editEnd, setEditEnd] = useState("09:00");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editRecurring, setEditRecurring] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sessRes, rmRes, grRes, stRes, subRes] = await Promise.all([
          fetch(`/api/sessions/${params.id}`),
          fetch("/api/rooms"),
          fetch("/api/groups"),
          fetch("/api/staff"),
          fetch("/api/subjects"),
        ]);

        if (!sessRes.ok) throw new Error("Failed to load session");
        const sessData = await sessRes.json();
        const s: SessionDetail = sessData.session;
        setSession(s);

        const rmData = await rmRes.json();
        setRooms((rmData.rooms ?? []).map((r: Option) => ({ id: r.id, name: r.name })));
        const grData = await grRes.json();
        setGroups((grData.groups ?? []).map((g: Option) => ({ id: g.id, name: g.name })));
        const stData = await stRes.json();
        const staffList = (stData.staff ?? []) as { id: string; role: string; person: { firstName: string; lastName: string } }[];
        setTeachers(staffList.filter((st) => st.role === "TEACHER" || st.role === "TRAINER").map((st) => ({ id: st.id, name: `${st.person.firstName} ${st.person.lastName}` })));
        const subData = await subRes.json();
        setSubjects((subData.subjects ?? []).map((sb: Option) => ({ id: sb.id, name: sb.name })));

        setEditRoomId(s.room?.id ?? "");
        setEditGroupId(s.group?.id ?? "");
        setEditTeacherId(s.teacher?.id ?? "");
        setEditSubjectId(s.subject?.id ?? "");
        setEditDay(s.dayOfWeek);
        setEditStart(s.startTime);
        setEditEnd(s.endTime);
        setEditStartDate(s.startDate);
        setEditEndDate(s.endDate ?? "");
        setEditRecurring(s.isRecurring);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    setError(null);
    setConflicts(null);

    if (editStart >= editEnd) {
      setError("End time must be after start time.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: editRoomId,
          groupId: editGroupId || null,
          teacherId: editTeacherId || null,
          subjectId: editSubjectId || null,
          dayOfWeek: editDay,
          startTime: editStart,
          endTime: editEnd,
          startDate: editStartDate,
          endDate: editEndDate || null,
          isRecurring: editRecurring,
        }),
      });

      if (res.status === 409) {
        const data = await res.json();
        setConflicts((data.conflicts ?? []).map((c: { message?: string }) => c.message ?? "Conflict detected"));
        setSaving(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update session");
        setSaving(false);
        return;
      }

      const data = await res.json();
      setSession(data.session);
      setEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!session || !window.confirm("Are you sure you want to delete this session?")) return;
    try {
      const res = await fetch(`/api/sessions/${session.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/sessions");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleCancelEdit = () => {
    if (!session) return;
    setEditing(false);
    setError(null);
    setConflicts(null);
    setEditRoomId(session.room?.id ?? "");
    setEditGroupId(session.group?.id ?? "");
    setEditTeacherId(session.teacher?.id ?? "");
    setEditSubjectId(session.subject?.id ?? "");
    setEditDay(session.dayOfWeek);
    setEditStart(session.startTime);
    setEditEnd(session.endTime);
    setEditStartDate(session.startDate);
    setEditEndDate(session.endDate ?? "");
    setEditRecurring(session.isRecurring);
  };

  if (loading) return <LoadingState />;
  if (error && !session) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">{error}</div>;
  if (!session) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg border border-zinc-200 p-2 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageHeader
          title="Session Details"
          description={`${DAY_LABELS[session.dayOfWeek] ?? session.dayOfWeek} ${session.startTime} – ${session.endTime}`}
          icon={<CalendarDays className="h-5 w-5" />}
        />
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{error}</div>}

      {conflicts && conflicts.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Schedule Conflicts</p>
          <ul className="mt-2 space-y-1">
            {conflicts.map((c, i) => <li key={i} className="text-sm text-amber-700 dark:text-amber-400">{c}</li>)}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Session Information</h3>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Room</label>
                  <select value={editRoomId} onChange={(e) => setEditRoomId(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                    <option value="">Select room...</option>
                    {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Teacher</label>
                    <select value={editTeacherId} onChange={(e) => setEditTeacherId(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                      <option value="">Select teacher...</option>
                      {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Subject</label>
                    <select value={editSubjectId} onChange={(e) => setEditSubjectId(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                      <option value="">Select subject...</option>
                      {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Group</label>
                  <select value={editGroupId} onChange={(e) => setEditGroupId(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                    <option value="">Select group...</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Day of Week</label>
                  <select value={editDay} onChange={(e) => setEditDay(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                    {DAYS.map((d) => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Start Time</label>
                    <input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">End Time</label>
                    <input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Start Date</label>
                    <input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">End Date</label>
                    <input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="editRecurring" checked={editRecurring} onChange={(e) => setEditRecurring(e.target.checked)} className="h-4 w-4 rounded border-zinc-300" />
                  <label htmlFor="editRecurring" className="text-sm text-zinc-700 dark:text-zinc-300">Recurring weekly</label>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3"><BookOpen className="h-4 w-4 text-zinc-400" /><span className="font-medium">{session.subject?.name ?? session.module?.name ?? "No subject assigned"}</span></div>
                <div className="flex items-center gap-3"><User className="h-4 w-4 text-zinc-400" /><span>{session.teacher ? `${session.teacher.staff.person.firstName} ${session.teacher.staff.person.lastName}` : "No teacher assigned"}</span></div>
                <div className="flex items-center gap-3"><Users className="h-4 w-4 text-zinc-400" /><span>{session.group?.name ?? "No group assigned"}</span></div>
                <div className="flex items-center gap-3"><Building2 className="h-4 w-4 text-zinc-400" /><span>{session.room?.name ?? "No room"} <span className="text-zinc-400">{session.room ? `(capacity: ${session.room.capacity})` : ""}</span></span></div>
                <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-zinc-400" /><span>{DAY_LABELS[session.dayOfWeek] ?? session.dayOfWeek}, {session.startTime} – {session.endTime}</span></div>
                <div className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-zinc-400" /><span>Starts: {new Date(session.startDate).toLocaleDateString()}{session.endDate ? ` — Ends: ${new Date(session.endDate).toLocaleDateString()}` : ""}</span></div>
                <div className="flex items-center gap-3"><span className="h-4 w-4 text-center text-zinc-400">↻</span><span>{session.isRecurring ? "Recurring weekly" : "One-time session"}</span></div>
              </div>
            )}
          </div>

          {session.schedule && !editing && (
            <div className="rounded-xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Schedule</h3>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{session.schedule.name}</span>
            </div>
          )}

          {session.module && !editing && (
            <div className="rounded-xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Training Context</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 text-zinc-400" />
                  <span className="font-medium">{session.module.name}</span>
                </div>
                {session.module.program && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-600 dark:text-zinc-400">{session.module.program.name}</span>
                  </div>
                )}
                {session.group && (
                  <div className="flex items-center gap-3">
                    <LinkIcon className="h-4 w-4 text-zinc-400" />
                    <a href={`/cohorts/${session.group.id}`} className="text-brand-600 hover:underline dark:text-brand-400">
                      View Cohort: {session.group.name}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Status</h3>
            {session.isActive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" /> Inactive
              </span>
            )}
          </div>

          <div className="space-y-2">
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving} className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50">
                  <Save className="mr-1 inline h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={handleCancelEdit} className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800">
                  <X className="mr-1 inline h-4 w-4" />
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                  <Pencil className="mr-1 inline h-4 w-4" />
                  Edit Session
                </button>
                <button onClick={handleDelete} className="w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950">
                  <Trash2 className="mr-1 inline h-4 w-4" />
                  Delete Session
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
