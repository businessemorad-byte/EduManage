"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft, Timer, Calendar, Clock, User, MapPin, Users, Target } from "lucide-react";

type Trial = {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  attended: boolean | null;
  result: string | null;
  notes: string | null;
  lead: { id: string; studentName: string; parentName: string | null; phone: string | null; email: string | null };
  subject: { name: string } | null;
  teacher: { staff: { person: { firstName: string; lastName: string } } } | null;
  room: { name: string } | null;
  group: { name: string } | null;
};

export default function TrialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [trial, setTrial] = useState<Trial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/trials/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setTrial(data.trial))
      .catch(() => setError("Trial not found"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingState />;

  if (error || !trial) {
    return (
      <div className="animate-fade-in space-y-4">
        <PageHeader
          title="Trial Detail"
          description="View trial session information."
          icon={<Timer className="h-5 w-5" />}
        />
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">{error || "Trial not found"}</p>
          <button onClick={() => router.back()} className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const teacherName = trial.teacher
    ? `${trial.teacher.staff.person.firstName} ${trial.teacher.staff.person.lastName}`
    : "Not assigned";

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={`Trial — ${trial.lead.studentName}`}
        description="Trial session detail"
        icon={<Timer className="h-5 w-5" />}
        action={
          <button onClick={() => router.back()} className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Student Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Student Name</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{trial.lead.studentName}</p>
                </div>
              </div>
              {trial.lead.parentName && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-zinc-500">Parent</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{trial.lead.parentName}</p>
                  </div>
                </div>
              )}
              {trial.lead.phone && (
                <div>
                  <p className="text-sm text-zinc-500">Phone</p>
                  <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">{trial.lead.phone}</p>
                </div>
              )}
              {trial.lead.email && (
                <div>
                  <p className="text-sm text-zinc-500">Email</p>
                  <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">{trial.lead.email}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Session Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Date</p>
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {new Date(trial.scheduledDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Time</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{trial.startTime} — {trial.endTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Teacher</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{teacherName}</p>
                </div>
              </div>
              {trial.subject && (
                <div className="flex items-center gap-3 text-sm">
                  <Target className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-zinc-500">Subject</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{trial.subject.name}</p>
                  </div>
                </div>
              )}
              {trial.room && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-zinc-500">Room</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{trial.room.name}</p>
                  </div>
                </div>
              )}
              {trial.group && (
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-zinc-500">Group</p>
                    <p className="font-medium text-zinc-900 dark:text-white">{trial.group.name}</p>
                  </div>
                </div>
              )}
            </div>
            {trial.notes && (
              <div className="mt-4 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <p className="text-sm text-zinc-500">Notes</p>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{trial.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Status</h3>
            <StatusBadge status={trial.status} />
            {trial.attended !== null && (
              <div className="mt-3 text-sm text-zinc-500">
                Attended: <span className="font-medium text-zinc-900 dark:text-white">{trial.attended ? "Yes" : "No"}</span>
              </div>
            )}
            {trial.result && (
              <div className="mt-2 text-sm text-zinc-500">
                Result: <span className="font-medium text-zinc-900 dark:text-white">{trial.result}</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/leads/${trial.lead.id}`)}
                className="flex w-full items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                <Target className="h-4 w-4" /> View Lead
              </button>
              <button
                onClick={() => router.push(`/leads/${trial.lead.id}`)}
                className="flex w-full items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400"
              >
                <User className="h-4 w-4" /> Contact Student
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
