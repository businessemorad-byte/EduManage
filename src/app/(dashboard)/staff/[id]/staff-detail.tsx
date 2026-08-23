"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingState } from "@/components/ui/loading-state";
import { ArrowLeft, Mail, Phone, Building2, Calendar, Briefcase, Edit } from "lucide-react";

type StaffData = {
  id: string;
  employeeId: string | null;
  department: string | null;
  position: string | null;
  hireDate: string | null;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
    email: string | null;
    phone: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    address: string | null;
    city: string | null;
    status: string;
  };
  teacher: {
    id: string;
    employmentType: string;
    status: string;
    qualification: string | null;
    specialization: string | null;
    hourlyRate: number | null;
  } | null;
  trainer: {
    id: string;
    employmentType: string | null;
    status: string;
    hourlyRate: number | null;
    certifications: unknown;
    specialties: unknown;
  } | null;
  organization: { name: string; type: string };
};

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0">
      <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{value || "—"}</span>
    </div>
  );
}

export function StaffDetail({ staffId }: { staffId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [staff, setStaff] = useState<StaffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/staff/${staffId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => setStaff(d.staff))
      .catch(() => setError("Staff member not found"))
      .finally(() => setLoading(false));
  }, [staffId]);

  if (loading) return <div className="p-6"><LoadingState /></div>;
  if (error || !staff) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{error || "Not found"}</p>
        <button onClick={() => router.push("/staff")} className="mt-3 text-sm text-brand-600 hover:text-brand-700">
          Back to Staff
        </button>
      </div>
    );
  }

  const p = staff.person;
  const roleType = staff.teacher ? "Teacher" : staff.trainer ? "Trainer" : "Staff";

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => startTransition(() => router.push("/staff"))}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Staff
          </button>
        </div>
        <StatusBadge status={p.status} />
      </div>

      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-lg font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
          {p.firstName.charAt(0)}{p.lastName.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {p.firstName} {p.middleName ? `${p.middleName} ` : ""}{p.lastName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">
              {roleType}
            </span>
            {staff.employeeId && <span>ID: {staff.employeeId}</span>}
            {staff.department && <span>{staff.department}</span>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-zinc-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Personal Information</h2>
            <div>
              <InfoRow label="Email" value={p.email} />
              <InfoRow label="Phone" value={p.phone} />
              <InfoRow label="Date of Birth" value={p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : null} />
              <InfoRow label="Gender" value={p.gender} />
              <InfoRow label="Address" value={p.address} />
              <InfoRow label="City" value={p.city} />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Employment</h2>
            <div>
              <InfoRow label="Position" value={staff.position} />
              <InfoRow label="Department" value={staff.department} />
              <InfoRow label="Hire Date" value={staff.hireDate ? new Date(staff.hireDate).toLocaleDateString() : null} />
              {staff.teacher && (
                <>
                  <InfoRow label="Employment Type" value={staff.teacher.employmentType} />
                  <InfoRow label="Qualification" value={staff.teacher.qualification} />
                  <InfoRow label="Specialization" value={staff.teacher.specialization} />
                  <InfoRow label="Hourly Rate" value={staff.teacher.hourlyRate ? `$${staff.teacher.hourlyRate}` : null} />
                </>
              )}
              {staff.trainer && (
                <>
                  <InfoRow label="Employment Type" value={staff.trainer.employmentType} />
                  <InfoRow label="Hourly Rate" value={staff.trainer.hourlyRate ? `$${staff.trainer.hourlyRate}` : null} />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Quick Contact</h2>
            <div className="space-y-3">
              {p.email && (
                <a href={`mailto:${p.email}`} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  {p.email}
                </a>
              )}
              {p.phone && (
                <a href={`tel:${p.phone}`} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  {p.phone}
                </a>
              )}
              <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Building2 className="h-4 w-4 text-zinc-400" />
                {staff.department || "No department"}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Details</h2>
            <div>
              <InfoRow label="Role Type" value={roleType} />
              <InfoRow label="Organization" value={staff.organization.name} />
              {staff.teacher && <InfoRow label="Status" value={staff.teacher.status} />}
              {staff.trainer && <InfoRow label="Status" value={staff.trainer.status} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
