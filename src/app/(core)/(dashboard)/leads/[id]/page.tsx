"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft, Target, Phone, Mail, Calendar, MapPin, User, ExternalLink } from "lucide-react";

type Lead = {
  id: string;
  studentName: string;
  parentName: string | null;
  phone: string | null;
  email: string | null;
  source: string;
  status: string;
  preferredSchedule: string | null;
  notes: string | null;
  createdAt: string;
  branch: { id: string; name: string } | null;
  desiredLevel: { id: string; name: string } | null;
  student: { id: string; person: { firstName: string; lastName: string } } | null;
  trialSessions: Array<{
    id: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    status: string;
    attended: boolean | null;
    teacher: { staff: { person: { firstName: string; lastName: string } } } | null;
    room: { name: string } | null;
  }>;
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/leads/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setLead(data.lead))
      .catch(() => setError("Lead not found"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingState />;

  if (error || !lead) {
    return (
      <div className="animate-fade-in space-y-4">
        <PageHeader
          title="Lead Detail"
          description="View lead information."
          icon={<Target className="h-5 w-5" />}
        />
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
          <p className="text-sm text-zinc-500">{error || "Lead not found"}</p>
          <button onClick={() => router.back()} className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={lead.studentName}
        description="Lead detail"
        icon={<Target className="h-5 w-5" />}
        action={
          <button onClick={() => router.back()} className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Contact Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-zinc-500">Student Name</p>
                  <p className="font-medium text-zinc-900">{lead.studentName}</p>
                </div>
              </div>
              {lead.parentName && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-zinc-500">Parent Name</p>
                    <p className="font-medium text-zinc-900">{lead.parentName}</p>
                  </div>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-zinc-500">Phone</p>
                    <p className="font-medium text-zinc-900">{lead.phone}</p>
                  </div>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-zinc-500">Email</p>
                    <p className="font-medium text-zinc-900">{lead.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Lead Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-zinc-500">Source</p>
                <p className="mt-1 text-sm font-medium text-zinc-900">{lead.source}</p>
              </div>
              {lead.branch && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-zinc-500">Branch</p>
                    <p className="font-medium text-zinc-900">{lead.branch.name}</p>
                  </div>
                </div>
              )}
              {lead.desiredLevel && (
                <div>
                  <p className="text-sm text-zinc-500">Desired Level</p>
                  <p className="mt-1 text-sm font-medium text-zinc-900">{lead.desiredLevel.name}</p>
                </div>
              )}
              {lead.preferredSchedule && (
                <div>
                  <p className="text-sm text-zinc-500">Preferred Schedule</p>
                  <p className="mt-1 text-sm font-medium text-zinc-900">{lead.preferredSchedule}</p>
                </div>
              )}
            </div>
            {lead.notes && (
              <div className="mt-4 rounded-lg bg-zinc-50 p-3">
                <p className="text-sm text-zinc-500">Notes</p>
                <p className="mt-1 text-sm text-zinc-700">{lead.notes}</p>
              </div>
            )}
          </div>

          {lead.trialSessions.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900">Trial Sessions</h3>
              <div className="space-y-3">
                {lead.trialSessions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => router.push(`/trials/${t.id}`)}
                    className="flex w-full items-center justify-between rounded-lg border border-zinc-100 p-3 text-left hover:bg-zinc-50"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-zinc-400" />
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          {new Date(t.scheduledDate).toLocaleDateString()} • {t.startTime} — {t.endTime}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {t.teacher ? `${t.teacher.staff.person.firstName} ${t.teacher.staff.person.lastName}` : "No teacher"}
                          {t.room ? ` • ${t.room.name}` : ""}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={t.status} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Status</h3>
            <StatusBadge status={lead.status} />
            <div className="mt-4 space-y-2 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Created {new Date(lead.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {lead.student && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900">Converted Student</h3>
              <button
                onClick={() => router.push(`/students/${lead.student!.id}`)}
                className="flex w-full items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
              >
                <ExternalLink className="h-4 w-4" />
                View Student Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
