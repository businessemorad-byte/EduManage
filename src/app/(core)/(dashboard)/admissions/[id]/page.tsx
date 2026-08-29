"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArrowLeft, ClipboardCheck, User, Phone, Mail, Calendar, MapPin, BookOpen } from "lucide-react";

type Admission = {
  id: string;
  applicantName: string;
  applicantEmail: string | null;
  applicantPhone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  previousSchool: string | null;
  status: string;
  notes: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  relationship: string | null;
  createdAt: string;
  reviewedAt: string | null;
  academicYear: { id: string; name: string } | null;
  desiredLevel: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
  student: { id: string; person: { firstName: string; lastName: string } } | null;
};

export default function AdmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admissions/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setAdmission(data.admission))
      .catch(() => setError("Admission not found"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingState />;

  if (error || !admission) {
    return (
      <div className="animate-fade-in space-y-4">
        <PageHeader title="Admission Detail" description="View admission application." icon={<ClipboardCheck className="h-5 w-5" />} />
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
          <p className="text-sm text-zinc-500">{error || "Admission not found"}</p>
          <button onClick={() => router.back()} className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700">Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={admission.applicantName}
        description="Admission application"
        icon={<ClipboardCheck className="h-5 w-5" />}
        action={
          <button onClick={() => router.back()} className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Applicant Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-zinc-400" />
                <div><p className="text-zinc-500">Full Name</p><p className="font-medium text-zinc-900">{admission.applicantName}</p></div>
              </div>
              {admission.applicantPhone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <div><p className="text-zinc-500">Phone</p><p className="font-medium text-zinc-900">{admission.applicantPhone}</p></div>
                </div>
              )}
              {admission.applicantEmail && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <div><p className="text-zinc-500">Email</p><p className="font-medium text-zinc-900">{admission.applicantEmail}</p></div>
                </div>
              )}
              {admission.dateOfBirth && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  <div><p className="text-zinc-500">Date of Birth</p><p className="font-medium text-zinc-900">{new Date(admission.dateOfBirth).toLocaleDateString()}</p></div>
                </div>
              )}
              {admission.gender && (
                <div><p className="text-sm text-zinc-500">Gender</p><p className="mt-1 text-sm font-medium text-zinc-900">{admission.gender}</p></div>
              )}
              {admission.nationality && (
                <div><p className="text-sm text-zinc-500">Nationality</p><p className="mt-1 text-sm font-medium text-zinc-900">{admission.nationality}</p></div>
              )}
              {admission.previousSchool && (
                <div><p className="text-sm text-zinc-500">Previous School</p><p className="mt-1 text-sm font-medium text-zinc-900">{admission.previousSchool}</p></div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Academic Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {admission.academicYear && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  <div><p className="text-zinc-500">Academic Year</p><p className="font-medium text-zinc-900">{admission.academicYear.name}</p></div>
                </div>
              )}
              {admission.desiredLevel && (
                <div className="flex items-center gap-3 text-sm">
                  <BookOpen className="h-4 w-4 text-zinc-400" />
                  <div><p className="text-zinc-500">Desired Level</p><p className="font-medium text-zinc-900">{admission.desiredLevel.name}</p></div>
                </div>
              )}
              {admission.branch && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-zinc-400" />
                  <div><p className="text-zinc-500">Branch</p><p className="font-medium text-zinc-900">{admission.branch.name}</p></div>
                </div>
              )}
            </div>
          </div>

          {(admission.guardianName || admission.guardianPhone || admission.guardianEmail) && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900">Guardian Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {admission.guardianName && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-zinc-400" />
                    <div><p className="text-zinc-500">Guardian Name</p><p className="font-medium text-zinc-900">{admission.guardianName}</p></div>
                  </div>
                )}
                {admission.guardianPhone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-zinc-400" />
                    <div><p className="text-zinc-500">Guardian Phone</p><p className="font-medium text-zinc-900">{admission.guardianPhone}</p></div>
                  </div>
                )}
                {admission.guardianEmail && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-zinc-400" />
                    <div><p className="text-zinc-500">Guardian Email</p><p className="font-medium text-zinc-900">{admission.guardianEmail}</p></div>
                  </div>
                )}
                {admission.relationship && (
                  <div><p className="text-sm text-zinc-500">Relationship</p><p className="mt-1 text-sm font-medium text-zinc-900">{admission.relationship}</p></div>
                )}
              </div>
            </div>
          )}

          {admission.notes && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900">Notes</h3>
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-sm text-zinc-700">{admission.notes}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Status</h3>
            <StatusBadge status={admission.status} />
            <div className="mt-4 space-y-2 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Applied {new Date(admission.createdAt).toLocaleDateString()}
              </div>
              {admission.reviewedAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Reviewed {new Date(admission.reviewedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {admission.student && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900">Enrolled Student</h3>
              <button
                onClick={() => router.push(`/students/${admission.student!.id}`)}
                className="flex w-full items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
              >
                <User className="h-4 w-4" /> View Student Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
