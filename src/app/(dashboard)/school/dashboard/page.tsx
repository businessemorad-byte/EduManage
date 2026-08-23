"use client";

import { useFetch } from "@/hooks/use-fetch";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatCardSkeleton } from "@/components/dashboard/skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  GraduationCap,
  UserCheck,
  Users,
  ClipboardCheck,
  BarChart3,
  CreditCard,
  Wallet,
  LayoutDashboard,
  ArrowUpRight,
  Calendar,
  Building2,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

type DashboardData = {
  students: { total: number; active: number };
  teachers: { total: number };
  classes: { total: number };
  admissions: { pending: number };
  attendance: { rate: number; thisMonth: number };
  finance: { outstanding: number; collectionRate: number; monthlyRevenue: number };
  scheduling: { todaySessions: number; totalSessions: number; availableRooms: number };
};

export default function SchoolDashboardPage() {
  const { data, loading } = useFetch<DashboardData>("/api/school/dashboard");

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Dashboard" icon={<LayoutDashboard className="h-5 w-5" />} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="h-48 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-48 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-48 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          <BarChart3 className="h-7 w-7 text-zinc-400" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Failed to load dashboard</h3>
        <p className="mt-1 text-sm text-zinc-500">Please try refreshing the page.</p>
      </div>
    );
  }

  const quickActions = [
    { label: "Students", href: "/students", icon: <GraduationCap className="h-4 w-4" /> },
    { label: "Attendance", href: "/attendance", icon: <BarChart3 className="h-4 w-4" /> },
    { label: "Finance", href: "/finance", icon: <Wallet className="h-4 w-4" /> },
    { label: "Timetable", href: "/timetable", icon: <Calendar className="h-4 w-4" /> },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here's what's happening today."
        icon={<LayoutDashboard className="h-5 w-5" />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Active Students"
          value={data.students.active}
          subtitle={`${data.students.total} total enrolled`}
          icon={<GraduationCap className="h-5 w-5" />}
          gradient="blue"
        />
        <StatCard
          label="Teachers"
          value={data.teachers.total}
          icon={<UserCheck className="h-5 w-5" />}
          gradient="green"
        />
        <StatCard
          label="Classes"
          value={data.classes.total}
          icon={<Users className="h-5 w-5" />}
          gradient="purple"
        />
        <StatCard
          label="Pending Admissions"
          value={data.admissions.pending}
          icon={<ClipboardCheck className="h-5 w-5" />}
          gradient="amber"
        />
        <StatCard
          label="Today's Sessions"
          value={data.scheduling.todaySessions}
          subtitle={`${data.scheduling.totalSessions} total weekly sessions`}
          icon={<Calendar className="h-5 w-5" />}
          gradient="violet"
        />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Attendance Rate</span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {data.attendance.rate}%
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            {data.attendance.thisMonth} records this month
          </p>
        </div>

        <div className="rounded-xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
              <CreditCard className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Outstanding</span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            ${data.finance.outstanding.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            {data.finance.collectionRate}% collection rate
          </p>
        </div>

        <div className="rounded-xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Monthly Revenue</span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            ${data.finance.monthlyRevenue.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Available Rooms</span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {data.scheduling.availableRooms}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 transition-all hover:border-brand-200 hover:bg-brand-50 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-brand-800 dark:hover:bg-brand-900/20"
            >
              <span className="text-zinc-400 transition-colors group-hover:text-brand-600 dark:text-zinc-500 dark:group-hover:text-brand-400">
                {action.icon}
              </span>
              <span className="text-sm font-medium text-zinc-700 transition-colors group-hover:text-brand-700 dark:text-zinc-300 dark:group-hover:text-brand-400">
                {action.label}
              </span>
              <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-500 dark:text-zinc-600" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
