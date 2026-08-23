"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatCardSkeleton } from "@/components/dashboard/skeleton";
import {
  Users,
  GraduationCap,
  UserCheck,
  Baby,
  Briefcase,
  Target,
  Timer,
  ClipboardCheck,
  ArrowUpRight,
} from "lucide-react";

type PersonCounts = {
  students: number;
  teachers: number;
  trainers: number;
  parents: number;
  staff: number;
};

const modules = [
  {
    label: "Students",
    href: "/students",
    icon: <GraduationCap className="h-5 w-5" />,
    gradient: "blue" as const,
    description: "Manage student enrollment, profiles, and records.",
  },
  {
    label: "Parents",
    href: "/parents",
    icon: <Baby className="h-5 w-5" />,
    gradient: "purple" as const,
    description: "Parent profiles and student guardianship records.",
  },
  {
    label: "Teachers",
    href: "/teachers",
    icon: <UserCheck className="h-5 w-5" />,
    gradient: "green" as const,
    description: "Teacher profiles, qualifications, and assignments.",
  },
  {
    label: "Trainers",
    href: "/teachers?filter=trainer",
    icon: <Briefcase className="h-5 w-5" />,
    gradient: "amber" as const,
    description: "Training center instructors and specializations.",
  },
  {
    label: "Staff",
    href: "/staff",
    icon: <Users className="h-5 w-5" />,
    gradient: "slate" as const,
    description: "Staff members, departments, and roles.",
  },
  {
    label: "Leads",
    href: "/leads",
    icon: <Target className="h-5 w-5" />,
    gradient: "rose" as const,
    description: "Track prospects and manage the enrollment pipeline.",
  },
  {
    label: "Trials",
    href: "/trials",
    icon: <Timer className="h-5 w-5" />,
    gradient: "blue" as const,
    description: "Schedule and manage trial sessions.",
  },
  {
    label: "Admissions",
    href: "/admissions",
    icon: <ClipboardCheck className="h-5 w-5" />,
    gradient: "green" as const,
    description: "Review and process admission applications.",
  },
];

export default function PeopleOverviewPage() {
  const router = useRouter();
  const [counts, setCounts] = useState<PersonCounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/people?action=stats")
      .then((r) => r.json())
      .then(setCounts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="People"
        description="Manage students, parents, teachers and your entire organization."
        icon={<Users className="h-5 w-5" />}
        action={
          <button
            onClick={() => router.push("/students/new")}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            + Add Person
          </button>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : counts ? (
          <>
            <StatCard label="Students" value={counts.students} icon={<GraduationCap className="h-5 w-5" />} gradient="blue" />
            <StatCard label="Parents" value={counts.parents} icon={<Baby className="h-5 w-5" />} gradient="purple" />
            <StatCard label="Teachers" value={counts.teachers} icon={<UserCheck className="h-5 w-5" />} gradient="green" />
            <StatCard label="Trainers" value={counts.trainers} icon={<Briefcase className="h-5 w-5" />} gradient="amber" />
            <StatCard label="Staff" value={counts.staff} icon={<Users className="h-5 w-5" />} gradient="slate" />
          </>
        ) : null}
      </div>

      <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Modules</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((mod) => (
          <button
            key={mod.href}
            onClick={() => router.push(mod.href)}
            className="group flex items-start gap-4 rounded-xl border border-zinc-100 bg-white p-5 text-left transition-all hover:border-brand-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-brand-800"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400">
              {mod.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">{mod.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{mod.description}</p>
            </div>
            <ArrowUpRight className="mt-1 h-4 w-4 flex-shrink-0 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-500 dark:text-zinc-600" />
          </button>
        ))}
      </div>
    </div>
  );
}
