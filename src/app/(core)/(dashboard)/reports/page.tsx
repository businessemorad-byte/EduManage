"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, BookOpen, CalendarCheck, Wallet, UserPlus, Clock,
  BarChart3, Loader2, AlertCircle, TrendingUp, TrendingDown
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

type Overview = {
  students: { total: number; active: number; inactive: number; newThisMonth: number };
  staff: { total: number; teachers: number };
  academics: { activeGroups: number; avgScore: number | null };
  finance: { totalInvoiced: number; totalPaid: number; collectionRate: number };
  admissions: { totalLeads: number; conversionRate: number };
};

const CARDS = [
  { title: "People Report", desc: "Students, staff, groups & levels", icon: Users, href: "/reports/people", color: "from-blue-500 to-blue-600" },
  { title: "Academic Report", desc: "Grades, scores & performance", icon: BookOpen, href: "/reports/academic", color: "from-emerald-500 to-emerald-600" },
  { title: "Attendance Report", desc: "Rates, trends & anomalies", icon: CalendarCheck, href: "/reports/attendance", color: "from-violet-500 to-violet-600" },
  { title: "Finance Report", desc: "Revenue, payments & collection", icon: Wallet, href: "/reports/finance", color: "from-amber-500 to-amber-600" },
  { title: "Admissions Report", desc: "Leads, trials & conversions", icon: UserPlus, href: "/reports/admissions", color: "from-rose-500 to-rose-600" },
  { title: "Scheduling Report", desc: "Sessions, rooms & teacher load", icon: Clock, href: "/reports/scheduling", color: "from-cyan-500 to-cyan-600" },
];

function StatCard({ label, value, icon: Icon, trend }: { label: string; value: string | number; icon: React.ReactNode; trend?: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 flex items-center gap-4">
      <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center">
        {Icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-xl font-bold text-zinc-900">{value}</p>
      </div>
      {trend !== undefined && (
        <div className={"flex items-center gap-1 text-xs font-medium " + (trend >= 0 ? "text-emerald-600" : "text-rose-600")}>
          {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/reports/overview").then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setData).catch(() => setError("Unable to load report data. Please try again.")).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader icon={<BarChart3 />} title="Reports & Analytics" description="Organization performance at a glance" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-100 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 rounded-xl bg-zinc-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader icon={<BarChart3 />} title="Reports & Analytics" description="Organization performance at a glance" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-rose-700">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={<BarChart3 />} title="Reports & Analytics" description="Organization performance at a glance" />

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Students" value={data.students.active} icon={<Users />} trend={data.students.newThisMonth > 0 ? 12 : undefined} />
          <StatCard label="Teachers" value={data.staff.teachers} icon={<BookOpen />} />
          <StatCard label="Collection Rate" value={data.finance.collectionRate + "%"} icon={<Wallet />} />
          <StatCard label="Lead Conversion" value={data.admissions.conversionRate + "%"} icon={<TrendingUp />} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map(card => (
          <Link key={card.href} href={card.href} className="group block rounded-xl border border-zinc-200 bg-white p-6 hover:shadow-lg hover:border-brand-200 transition-all duration-200">
            <div className={"h-10 w-10 rounded-lg bg-gradient-to-br " + card.color + " flex items-center justify-center mb-4"}>
              <card.icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-brand-600 transition-colors">{card.title}</h3>
            <p className="text-xs text-zinc-500 mt-1">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
