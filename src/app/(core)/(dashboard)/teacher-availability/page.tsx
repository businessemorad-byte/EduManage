"use client";

import { useRouter } from "next/navigation";
import { useTransition, useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Clock, Trash2 } from "lucide-react";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

type Availability = {
  id: string;
  teacher: { staff: { person: { firstName: string; lastName: string } } };
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  branch: { name: string } | null;
};

type StaffOption = { id: string; name: string; role: string };

const inputClasses =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm";
const labelClasses = "mb-1 block text-sm font-medium text-zinc-700";

export default function TeacherAvailabilityPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [items, setItems] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [teachers, setTeachers] = useState<StaffOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(DAYS[0]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/teacher-availability")
      .then((r) => r.json())
      .then((data) => setItems(data.availabilities ?? []))
      .catch(() => setError("Failed to load availability"))
      .finally(() => setLoading(false));

    fetch("/api/staff")
      .then((r) => r.json())
      .then((data) =>
        setTeachers(
          (data.staff ?? [])
            .filter((s: { role: string }) => s.role === "TEACHER" || s.role === "TRAINER")
            .map((s: { id: string; person: { firstName: string; lastName: string }; role: string }) => ({
              id: s.id,
              name: `${s.person.firstName} ${s.person.lastName}`,
              role: s.role,
            })),
        ),
      )
      .catch(() => {});
  }, []);

  function resetForm() {
    setTeacherId("");
    setDayOfWeek(DAYS[0]);
    setStartTime("");
    setEndTime("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, dayOfWeek, startTime, endTime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add availability");
      const teacher = teachers.find((t) => t.id === teacherId);
      const [firstName, ...lastNameParts] = (teacher?.name ?? "").split(" ");
      setItems((prev) => [
        ...prev,
        data.availability ?? {
          id: data.id ?? crypto.randomUUID(),
          teacher: {
            staff: { person: { firstName: firstName ?? "", lastName: lastNameParts.join(" ") } },
          },
          dayOfWeek,
          startTime,
          endTime,
          branch: null,
        },
      ]);
      setShowForm(false);
      resetForm();
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      const res = await fetch("/api/teacher-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (!res.ok) throw new Error("Failed to delete availability");
      setItems((prev) => prev.filter((item) => item.id !== id));
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Teacher Availability"
        description="Manage teacher schedules and availability windows."
        icon={<Clock className="h-5 w-5" />}
        action={
          <button
            onClick={() => {
              setError(null);
              setShowForm((v) => !v);
            }}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            + Add Availability
          </button>
        }
      />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="teacherId" className={labelClasses}>
                Teacher *
              </label>
              <select
                id="teacherId"
                required
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className={inputClasses}
              >
                <option value="">Select a teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dayOfWeek" className={labelClasses}>
                Day of Week *
              </label>
              <select
                id="dayOfWeek"
                required
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className={inputClasses}
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {DAY_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startTime" className={labelClasses}>
                Start Time *
              </label>
              <input
                id="startTime"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="endTime" className={labelClasses}>
                End Time *
              </label>
              <input
                id="endTime"
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Add Availability"}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setError(null);
                setShowForm(false);
              }}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && !showForm && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-7 w-7" />}
          title="No availability configured"
          description="Set teacher availability to prevent scheduling conflicts."
          action={
            !showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                + Add Availability
              </button>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          columns={[
            {
              key: "teacher",
              header: "Teacher",
              render: (a: Availability) => (
                <span className="font-medium">
                  {a.teacher.staff.person.firstName} {a.teacher.staff.person.lastName}
                </span>
              ),
            },
            {
              key: "dayOfWeek",
              header: "Day",
              render: (a: Availability) => DAY_LABELS[a.dayOfWeek] ?? a.dayOfWeek,
            },
            {
              key: "time",
              header: "Time",
              render: (a: Availability) => `${a.startTime} – ${a.endTime}`,
            },
            {
              key: "branch",
              header: "Branch",
              render: (a: Availability) => a.branch?.name ?? "All",
            },
            {
              key: "actions",
              header: "",
              className: "text-right",
              render: (a: Availability) => (
                <button
                  onClick={() => handleDelete(a.id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                  title="Delete availability"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ),
            },
          ]}
          data={items}
        />
      )}
    </div>
  );
}
