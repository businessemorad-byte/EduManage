"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatCardSkeleton } from "@/components/dashboard/skeleton";
import {
  CalendarDays,
  BookOpen,
  Award,
  FileText,
  Users,
  ClipboardCheck,
  GraduationCap,
  ArrowUpRight,
} from "lucide-react";

type AcademicsCounts = {
  academicYears: number;
  levels: number;
  subjects: number;
  programs: number;
  groups: number;
  enrollments: number;
};

const modules = [
  {
    label: "Academic Years",
    href: "/academic-years",
    icon: <CalendarDays className="h-5 w-5" />,
    gradient: "blue" as const,
    description: "Configure academic years, terms, and semesters.",
  },
  {
    label: "Levels",
    href: "/levels",
    icon: <BookOpen className="h-5 w-5" />,
    gradient: "green" as const,
    description: "Define grade levels and academic tiers.",
  },
  {
    label: "Subjects",
    href: "/subjects",
    icon: <Award className="h-5 w-5" />,
    gradient: "purple" as const,
    description: "Manage subjects, courses, and curriculum areas.",
  },
  {
    label: "Programs",
    href: "/programs",
    icon: <FileText className="h-5 w-5" />,
    gradient: "amber" as const,
    description: "Create and organize academic programs.",
  },
  {
    label: "Groups / Classes",
    href: "/groups",
    icon: <Users className="h-5 w-5" />,
    gradient: "rose" as const,
    description: "Manage class groups, cohorts, and sections.",
  },
  {
    label: "Enrollments",
    href: "/enrollments",
    icon: <ClipboardCheck className="h-5 w-5" />,
    gradient: "slate" as const,
    description: "Track student enrollment and registration records.",
  },
  {
    label: "Student Progress",
    href: "/student-progress",
    icon: <GraduationCap className="h-5 w-5" />,
    gradient: "blue" as const,
    description: "View progress notes and academic performance.",
  },
];

export default function AcademicsOverviewPage() {
  const router = useRouter();
  const [counts, setCounts] = useState<AcademicsCounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/academics/stats")
      .then((r) => r.json())
      .then(setCounts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Academics"
        description="Manage academic structure, programs, groups, and student progress."
        icon={<BookOpen className="h-5 w-5" />}
        action={
          <button
            onClick={() => router.push("/academic-years")}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Academic Years
          </button>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : counts ? (
          <>
            <StatCard label="Academic Years" value={counts.academicYears} icon={<CalendarDays className="h-5 w-5" />} gradient="blue" />
            <StatCard label="Levels" value={counts.levels} icon={<BookOpen className="h-5 w-5" />} gradient="green" />
            <StatCard label="Subjects" value={counts.subjects} icon={<Award className="h-5 w-5" />} gradient="purple" />
            <StatCard label="Programs" value={counts.programs} icon={<FileText className="h-5 w-5" />} gradient="amber" />
            <StatCard label="Groups" value={counts.groups} icon={<Users className="h-5 w-5" />} gradient="rose" />
            <StatCard label="Active Enrollments" value={counts.enrollments} icon={<ClipboardCheck className="h-5 w-5" />} gradient="slate" />
          </>
        ) : null}
      </div>

      <h3 className="mb-4 text-sm font-semibold text-zinc-900">Modules</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {modules.map((mod) => (
          <button
            key={mod.href}
            onClick={() => router.push(mod.href)}
            className="group flex items-start gap-4 rounded-xl border border-zinc-100 bg-white p-5 text-left transition-all hover:border-brand-200 hover:shadow-md"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
              {mod.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900">{mod.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{mod.description}</p>
            </div>
            <ArrowUpRight className="mt-1 h-4 w-4 flex-shrink-0 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-500" />
          </button>
        ))}
      </div>
    </div>
  );
}
