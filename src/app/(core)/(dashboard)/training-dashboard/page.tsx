"use client";

import { Suspense, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import Link from "next/link";
import { Plus, Users, GraduationCap, CalendarPlus, ClipboardList } from "lucide-react";

type DashboardData = {
  totalLearners: number;
  activeLearners: number;
  totalPrograms: number;
  activePrograms: number;
  totalCohorts: number;
  activeCohorts: number;
  totalTrainers: number;
  totalCertificates: number;
  pendingCertificates: number;
  pendingLeads: number;
  corporateClients: number;
  activeContracts: number;
  monthlyRevenue: number;
  outstandingBalance: number;
  upcomingSessions: Array<{
    id: string;
    name: string;
    group: { name: string };
    teacher: { staff: { person: { firstName: string; lastName: string } } } | null;
    room: { name: string } | null;
    startTime: string;
    endTime: string;
    startDate: string;
  }>;
  recentEnrollments: Array<{
    id: string;
    student: { person: { firstName: string; lastName: string } };
    program: { name: string } | null;
    group: { name: string } | null;
    createdAt: string;
  }>;
};

function TrainingDashboardInner() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/training-dashboard", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setDashboard(data))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (loading) return <LoadingState />;
  if (!dashboard) return <EmptyState title="No dashboard data" description="Training data will appear once programs and cohorts are created." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Training Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Learners", value: dashboard.totalLearners, color: "text-violet-600" },
          { label: "Active Programs", value: dashboard.activePrograms, color: "text-blue-600" },
          { label: "Active Cohorts", value: dashboard.activeCohorts, color: "text-emerald-600" },
          { label: "Trainers", value: dashboard.totalTrainers, color: "text-amber-600" },
          { label: "Monthly Revenue", value: `${Number(dashboard.monthlyRevenue).toLocaleString()} DA`, color: "text-zinc-900" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">Recent Enrollments</h2>
          {dashboard.recentEnrollments.length === 0 ? (
            <p className="text-sm text-zinc-500">No recent enrollments.</p>
          ) : (
            <div className="space-y-2">
              {dashboard.recentEnrollments.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{e.student.person.firstName} {e.student.person.lastName}</span>
                  <span className="text-zinc-500">{e.program?.name ?? e.group?.name ?? "—"}</span>
                  <span className="text-zinc-400">{new Date(e.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">Upcoming Sessions</h2>
          {dashboard.upcomingSessions.length === 0 ? (
            <p className="text-sm text-zinc-500">No upcoming sessions.</p>
          ) : (
            <div className="space-y-2">
              {dashboard.upcomingSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-zinc-500">{s.group.name}</span>
                  <span className="text-zinc-400">{s.startTime}-{s.endTime}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Programs", value: dashboard.totalPrograms },
          { label: "Certificates", value: dashboard.totalCertificates },
          { label: "Pending Leads", value: dashboard.pendingLeads },
          { label: "Corporate Clients", value: dashboard.corporateClients },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">{stat.label}</p>
            <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/training-programs/new" className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium transition-colors hover:bg-zinc-50">
            <Plus className="h-4 w-4 text-violet-600" />
            New Program
          </Link>
          <Link href="/cohorts/new" className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium transition-colors hover:bg-zinc-50">
            <Users className="h-4 w-4 text-blue-600" />
            New Cohort
          </Link>
          <Link href="/trainees" className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium transition-colors hover:bg-zinc-50">
            <GraduationCap className="h-4 w-4 text-emerald-600" />
            Add Trainee
          </Link>
          <Link href="/training-attendance" className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium transition-colors hover:bg-zinc-50">
            <ClipboardList className="h-4 w-4 text-amber-600" />
            Attendance
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TrainingDashboardPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<LoadingState />}>
        <TrainingDashboardInner />
      </Suspense>
    </div>
  );
}
