"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingState } from "@/components/ui/loading-state";

type StudentProfile = {
  id: string;
  studentId: string | null;
  grade: string | null;
  enrollmentDate: string | null;
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
    state: string | null;
    country: string | null;
    status: string;
    avatarUrl: string | null;
  };
  guardians: {
    id: string;
    relationship: string;
    isPrimary: boolean;
    person: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null };
  }[];
  branch: { name: string } | null;
};

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between py-2 border-b border-zinc-100">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-medium text-zinc-900">{value || "—"}</span>
    </div>
  );
}

export function StudentProfile({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/students/${studentId}`)
      .then((r) => r.json())
      .then((data) => setStudent(data.student))
      .catch(() => router.push("/students"))
      .finally(() => setLoading(false));
  }, [studentId, router]);

  if (loading) return <LoadingState />;
  if (!student) return null;

  const p = student.person;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => startTransition(() => router.push("/students"))}
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            &larr; Back to Students
          </button>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            {p.firstName} {p.middleName} {p.lastName}
          </h1>
        </div>
        <StatusBadge status={p.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
          <div className="space-y-0">
            <InfoRow label="Email" value={p.email} />
            <InfoRow label="Phone" value={p.phone} />
            <InfoRow label="Date of Birth" value={p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : null} />
            <InfoRow label="Gender" value={p.gender} />
            <InfoRow label="Address" value={p.address} />
            <InfoRow label="City" value={p.city} />
            <InfoRow label="State" value={p.state} />
            <InfoRow label="Country" value={p.country} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold mb-4">Enrollment</h2>
            <div className="space-y-0">
              <InfoRow label="Student ID" value={student.studentId} />
              <InfoRow label="Grade" value={student.grade} />
              <InfoRow label="Branch" value={student.branch?.name} />
              <InfoRow
                label="Enrolled"
                value={student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : null}
              />
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold mb-4">Guardians ({student.guardians.length})</h2>
            {student.guardians.length === 0 ? (
              <p className="text-sm text-zinc-500">No guardians linked.</p>
            ) : (
              <div className="space-y-3">
                {student.guardians.map((g) => (
                  <div key={g.id} className="flex items-center justify-between rounded-md border border-zinc-100 p-3">
                    <div>
                      <p className="text-sm font-medium">{g.person.firstName} {g.person.lastName}</p>
                      <p className="text-xs text-zinc-500">{g.relationship}{g.isPrimary ? " (Primary)" : ""}</p>
                    </div>
                    <div className="text-right">
                      {g.person.email && <p className="text-xs text-zinc-500">{g.person.email}</p>}
                      {g.person.phone && <p className="text-xs text-zinc-500">{g.person.phone}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
