"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingState } from "@/components/ui/loading-state";
import { ArrowLeft, Mail, Phone, Briefcase, MapPin } from "lucide-react";

type ParentData = {
  id: string;
  occupation: string | null;
  workplace: string | null;
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
  children?: {
    id: string;
    student: {
      id: string;
      studentId: string | null;
      person: { firstName: string; lastName: string };
    };
  }[];
};

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0">
      <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{value || "—"}</span>
    </div>
  );
}

export function ParentDetail({ parentId }: { parentId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [parent, setParent] = useState<ParentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/parents/${parentId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => setParent(d.parent))
      .catch(() => setError("Parent not found"))
      .finally(() => setLoading(false));
  }, [parentId]);

  if (loading) return <div className="p-6"><LoadingState /></div>;
  if (error || !parent) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{error || "Not found"}</p>
        <button onClick={() => router.push("/parents")} className="mt-3 text-sm text-brand-600 hover:text-brand-700">
          Back to Parents
        </button>
      </div>
    );
  }

  const p = parent.person;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => startTransition(() => router.push("/parents"))}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Parents
        </button>
        <StatusBadge status={p.status} />
      </div>

      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100 text-lg font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          {p.firstName.charAt(0)}{p.lastName.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {p.firstName} {p.middleName ? `${p.middleName} ` : ""}{p.lastName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
              Parent
            </span>
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
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Professional Information</h2>
            <div>
              <InfoRow label="Occupation" value={parent.occupation} />
              <InfoRow label="Workplace" value={parent.workplace} />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">
              Children {parent.children && parent.children.length > 0 ? `(${parent.children.length})` : ""}
            </h2>
            {(!parent.children || parent.children.length === 0) ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No linked children.</p>
            ) : (
              <div className="space-y-2">
                {parent.children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => router.push(`/students/${c.student.id}`)}
                    className="flex w-full items-center justify-between rounded-lg border border-zinc-100 px-4 py-3 text-left transition-colors hover:border-brand-200 hover:bg-brand-50/30 dark:border-zinc-800 dark:hover:border-brand-800 dark:hover:bg-brand-900/10"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {c.student.person.firstName} {c.student.person.lastName}
                      </p>
                      {c.student.studentId && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">ID: {c.student.studentId}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
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
              {parent.occupation && (
                <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Briefcase className="h-4 w-4 text-zinc-400" />
                  {parent.occupation}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
