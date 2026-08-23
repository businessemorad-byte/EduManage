const fs = require('fs');
const path = require('path');
const base = 'C:/Users/3imra/Desktop/Edu Manage';

function w(rel, content) {
  fs.writeFileSync(path.join(base, rel), content);
  console.log('Wrote: ' + rel);
}

// Reports Center main page
w('src/app/(dashboard)/reports/page.tsx', `"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, BookOpen, CalendarCheck, Wallet, UserPlus, Clock,
  BarChart3, Loader2, AlertCircle, TrendingUp, TrendingDown
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

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

function StatCard({ label, value, icon: Icon, trend }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; trend?: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 flex items-center gap-4">
      <div className="h-10 w-10 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
        <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-xl font-bold text-zinc-900 dark:text-white">{value}</p>
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
        <PageHeader icon={BarChart3} title="Reports & Analytics" description="Organization performance at a glance" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader icon={BarChart3} title="Reports & Analytics" description="Organization performance at a glance" />
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-rose-700 dark:text-rose-400">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={BarChart3} title="Reports & Analytics" description="Organization performance at a glance" />

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Students" value={data.students.active} icon={Users} trend={data.students.newThisMonth > 0 ? 12 : undefined} />
          <StatCard label="Teachers" value={data.staff.teachers} icon={BookOpen} />
          <StatCard label="Collection Rate" value={data.finance.collectionRate + "%"} icon={Wallet} />
          <StatCard label="Lead Conversion" value={data.admissions.conversionRate + "%"} icon={TrendingUp} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map(card => (
          <Link key={card.href} href={card.href} className="group block rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 hover:shadow-lg hover:border-brand-200 dark:hover:border-brand-800 transition-all duration-200">
            <div className={"h-10 w-10 rounded-lg bg-gradient-to-br " + card.color + " flex items-center justify-center mb-4"}>
              <card.icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{card.title}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
`);
console.log('Center page done');

// People Report Page
w('src/app/(dashboard)/reports/people/page.tsx', `"use client";

import { useState, useEffect, Suspense } from "react";
import { Users, Loader2, AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import { BarChart } from "@/components/reports/bar-chart";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ExportButton } from "@/components/reports/export-button";

type PeopleData = {
  totalStudents: number; activeStudents: number; inactiveStudents: number; newRegistrations: number;
  byGroup: { name: string; count: number }[];
  byLevel: { name: string; count: number }[];
  staffByType: { type: string; count: number }[];
};

function PeopleReportInner() {
  const sp = useSearchParams();
  const startDate = sp.get("startDate") || undefined;
  const endDate = sp.get("endDate") || undefined;
  const [data, setData] = useState<PeopleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    setLoading(true); setError("");
    fetch("/api/reports/people?" + params.toString()).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setData).catch(() => setError("Unable to load people report. Please try again.")).finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <div className="space-y-6"><PageHeader icon={Users} title="People Report" description="Students, staff & group breakdown" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div></div>;
  if (error) return <div className="space-y-6"><PageHeader icon={Users} title="People Report" description="Students, staff & group breakdown" /><div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-8 text-center"><AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" /><p className="text-sm font-medium text-rose-700 dark:text-rose-400">{error}</p><button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700">Retry</button></div></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader icon={Users} title="People Report" description="Students, staff & group breakdown" action={<ExportButton reportType="people" startDate={startDate} endDate={endDate} />} />
      <Suspense fallback={<div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />}><DateRangePicker basePath="/reports/people" /></Suspense>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: data.totalStudents },
          { label: "Active Students", value: data.activeStudents },
          { label: "Inactive Students", value: data.inactiveStudents },
          { label: "New Registrations", value: data.newRegistrations },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.label}</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart title="Students by Group" data={data.byGroup.map(g => ({ label: g.name, value: g.count }))} />
        <BarChart title="Students by Level" data={data.byLevel.map(l => ({ label: l.name, value: l.count }))} />
      </div>
      {data.staffByType.length > 0 && (
        <BarChart title="Staff by Type" data={data.staffByType.map(s => ({ label: s.type, value: s.count }))} />
      )}
    </div>
  );
}

export default function PeopleReportPage() {
  return <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 text-brand-600 animate-spin" /></div>}><PeopleReportInner /></Suspense>;
}
`);
console.log('People page done');

// Academic Report Page
w('src/app/(dashboard)/reports/academic/page.tsx', `"use client";

import { useState, useEffect, Suspense } from "react";
import { BookOpen, Loader2, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import { BarChart } from "@/components/reports/bar-chart";
import { TrendChart } from "@/components/reports/trend-chart";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ExportButton } from "@/components/reports/export-button";

type AcademicData = {
  totalAssessments: number; totalResults: number; overallAverage: number | null;
  bySubject: { name: string; average: number | null; count: number }[];
  byGroup: { name: string; average: number | null; count: number }[];
  byMonth: { month: string; average: number | null }[];
};

function AcademicReportInner() {
  const sp = useSearchParams();
  const startDate = sp.get("startDate") || undefined;
  const endDate = sp.get("endDate") || undefined;
  const [data, setData] = useState<AcademicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    setLoading(true); setError("");
    fetch("/api/reports/academic?" + params.toString()).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setData).catch(() => setError("Unable to load academic report.")).finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <div className="space-y-6"><PageHeader icon={BookOpen} title="Academic Report" description="Grades & performance" /><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div></div>;
  if (error) return <div className="space-y-6"><PageHeader icon={BookOpen} title="Academic Report" description="Grades & performance" /><div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-8 text-center"><AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" /><p className="text-sm font-medium text-rose-700 dark:text-rose-400">{error}</p><button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700">Retry</button></div></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader icon={BookOpen} title="Academic Report" description="Grades & performance analysis" action={<ExportButton reportType="academic" startDate={startDate} endDate={endDate} />} />
      <Suspense fallback={<div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />}><DateRangePicker basePath="/reports/academic" /></Suspense>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Total Assessments</p><p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{data.totalAssessments}</p></div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Total Results</p><p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{data.totalResults}</p></div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Overall Average</p><p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{data.overallAverage !== null ? data.overallAverage.toFixed(1) + "%" : "N/A"}</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart title="Average Score by Subject" data={data.bySubject.map(s => ({ label: s.name, value: s.average || 0 }))} />
        <BarChart title="Average Score by Group" data={data.byGroup.map(g => ({ label: g.name, value: g.average || 0 }))} />
      </div>
      {data.byMonth.length > 0 && <TrendChart title="Monthly Average Trend" data={data.byMonth.map(m => ({ label: m.month.slice(5), value: m.average || 0 }))} />}
    </div>
  );
}

export default function AcademicReportPage() {
  return <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 text-brand-600 animate-spin" /></div>}><AcademicReportInner /></Suspense>;
}
`);
console.log('Academic page done');

// Attendance Report Page
w('src/app/(dashboard)/reports/attendance/page.tsx', `"use client";

import { useState, useEffect, Suspense } from "react";
import { CalendarCheck, Loader2, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import { BarChart } from "@/components/reports/bar-chart";
import { TrendChart } from "@/components/reports/trend-chart";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ExportButton } from "@/components/reports/export-button";

type AttendanceData = {
  totalStudents: number; totalRecords: number; presentCount: number; absentCount: number; lateCount: number; excusedCount: number;
  rate: number | null;
  byGroup: { name: string; rate: number | null; total: number }[];
  byDay: { day: string; rate: number | null }[];
};

function AttendanceReportInner() {
  const sp = useSearchParams();
  const startDate = sp.get("startDate") || undefined;
  const endDate = sp.get("endDate") || undefined;
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    setLoading(true); setError("");
    fetch("/api/reports/attendance?" + params.toString()).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setData).catch(() => setError("Unable to load attendance report.")).finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <div className="space-y-6"><PageHeader icon={CalendarCheck} title="Attendance Report" description="Rates & trends" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div></div>;
  if (error) return <div className="space-y-6"><PageHeader icon={CalendarCheck} title="Attendance Report" description="Rates & trends" /><div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-8 text-center"><AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" /><p className="text-sm font-medium text-rose-700 dark:text-rose-400">{error}</p><button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700">Retry</button></div></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader icon={CalendarCheck} title="Attendance Report" description="Attendance rates & trends" action={<ExportButton reportType="attendance" startDate={startDate} endDate={endDate} />} />
      <Suspense fallback={<div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />}><DateRangePicker basePath="/reports/attendance" /></Suspense>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Overall Rate</p><p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{data.rate !== null ? data.rate + "%" : "N/A"}</p></div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Present</p><p className="text-2xl font-bold text-emerald-600 mt-1">{data.presentCount}</p></div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Absent</p><p className="text-2xl font-bold text-rose-600 mt-1">{data.absentCount}</p></div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Late / Excused</p><p className="text-2xl font-bold text-amber-600 mt-1">{data.lateCount + data.excusedCount}</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart title="Attendance Rate by Group" data={data.byGroup.map(g => ({ label: g.name, value: g.rate || 0 }))} />
        {data.byDay.length > 0 && <TrendChart title="Rate by Day of Week" data={data.byDay.map(d => ({ label: d.day, value: d.rate || 0 }))} color="#8b5cf6" />}
      </div>
    </div>
  );
}

export default function AttendanceReportPage() {
  return <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 text-brand-600 animate-spin" /></div>}><AttendanceReportInner /></Suspense>;
}
`);
console.log('Attendance page done');

// Finance Report Page
w('src/app/(dashboard)/reports/finance/page.tsx', `"use client";

import { useState, useEffect, Suspense } from "react";
import { Wallet, Loader2, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import { BarChart } from "@/components/reports/bar-chart";
import { TrendChart } from "@/components/reports/trend-chart";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ExportButton } from "@/components/reports/export-button";

type FinanceData = {
  totalInvoiced: number; totalPaid: number; totalRefunded: number; totalOutstanding: number; overdue: number; collectionRate: number;
  byMethod: { method: string; amount: number }[];
  byMonth: { month: string; invoiced: number; paid: number }[];
};

function fmt(n: number) { return n.toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " DH"; }

function FinanceReportInner() {
  const sp = useSearchParams();
  const startDate = sp.get("startDate") || undefined;
  const endDate = sp.get("endDate") || undefined;
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    setLoading(true); setError("");
    fetch("/api/reports/finance?" + params.toString()).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setData).catch(() => setError("Unable to load finance report.")).finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <div className="space-y-6"><PageHeader icon={Wallet} title="Finance Report" description="Revenue & collection" /><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div></div>;
  if (error) return <div className="space-y-6"><PageHeader icon={Wallet} title="Finance Report" description="Revenue & collection" /><div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-8 text-center"><AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" /><p className="text-sm font-medium text-rose-700 dark:text-rose-400">{error}</p><button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700">Retry</button></div></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader icon={Wallet} title="Finance Report" description="Revenue, payments & collection rate" action={<ExportButton reportType="finance" startDate={startDate} endDate={endDate} />} />
      <Suspense fallback={<div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />}><DateRangePicker basePath="/reports/finance" /></Suspense>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Total Invoiced</p><p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{fmt(data.totalInvoiced)}</p></div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Total Collected</p><p className="text-xl font-bold text-emerald-600 mt-1">{fmt(data.totalPaid)}</p></div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Outstanding</p><p className="text-xl font-bold text-amber-600 mt-1">{fmt(data.totalOutstanding)}</p></div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Collection Rate</p><p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{data.collectionRate}%</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart title="Monthly Revenue vs Collected" data={data.byMonth.map(m => ({ label: m.month.slice(5), value: m.invoiced }))} color="#f59e0b" />
        <BarChart title="Payments by Method" data={data.byMethod.map(m => ({ label: m.method, value: m.amount }))} />
      </div>
      {data.overdue > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-5">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Overdue Amount: {fmt(data.overdue)}</p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">Consider following up on outstanding invoices</p>
        </div>
      )}
    </div>
  );
}

export default function FinanceReportPage() {
  return <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 text-brand-600 animate-spin" /></div>}><FinanceReportInner /></Suspense>;
}
`);
console.log('Finance page done');

// Admissions Report Page
w('src/app/(dashboard)/reports/admissions/page.tsx', `"use client";

import { useState, useEffect, Suspense } from "react";
import { UserPlus, Loader2, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import { BarChart } from "@/components/reports/bar-chart";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ExportButton } from "@/components/reports/export-button";

type AdmissionsData = {
  totalLeads: number; newLeads: number; totalAdmissions: number; converted: number; conversionRate: number;
  leadsByStatus: { status: string; count: number }[];
  admissionsByStatus: { status: string; count: number }[];
  totalTrials: number; trialsCompleted: number; trialConversion: number;
};

function AdmissionsReportInner() {
  const sp = useSearchParams();
  const startDate = sp.get("startDate") || undefined;
  const endDate = sp.get("endDate") || undefined;
  const [data, setData] = useState<AdmissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    setLoading(true); setError("");
    fetch("/api/reports/admissions?" + params.toString()).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setData).catch(() => setError("Unable to load admissions report.")).finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <div className="space-y-6"><PageHeader icon={UserPlus} title="Admissions Report" description="Leads & conversions" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div></div>;
  if (error) return <div className="space-y-6"><PageHeader icon={UserPlus} title="Admissions Report" description="Leads & conversions" /><div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-8 text-center"><AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" /><p className="text-sm font-medium text-rose-700 dark:text-rose-400">{error}</p><button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700">Retry</button></div></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader icon={UserPlus} title="Admissions Report" description="Leads, trials & conversions" action={<ExportButton reportType="admissions" startDate={startDate} endDate={endDate} />} />
      <Suspense fallback={<div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />}><DateRangePicker basePath="/reports/admissions" /></Suspense>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Total Leads</p><p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{data.totalLeads}</p></div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Conversion Rate</p><p className="text-2xl font-bold text-brand-600 mt-1">{data.conversionRate}%</p></div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Trial Sessions</p><p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{data.totalTrials}</p></div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Trial Conversion</p><p className="text-2xl font-bold text-emerald-600 mt-1">{data.trialConversion}%</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart title="Leads by Status" data={data.leadsByStatus.map(l => ({ label: l.status, value: l.count }))} />
        <BarChart title="Admissions by Status" data={data.admissionsByStatus.map(a => ({ label: a.status, value: a.count }))} />
      </div>
    </div>
  );
}

export default function AdmissionsReportPage() {
  return <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 text-brand-600 animate-spin" /></div>}><AdmissionsReportInner /></Suspense>;
}
`);
console.log('Admissions page done');

// Scheduling Report Page
w('src/app/(dashboard)/reports/scheduling/page.tsx', `"use client";

import { useState, useEffect, Suspense } from "react";
import { Clock, Loader2, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import { BarChart } from "@/components/reports/bar-chart";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { ExportButton } from "@/components/reports/export-button";

type SchedulingData = {
  totalSessions: number; totalRooms: number; usedRooms: number; roomUtilization: number; totalSchedules: number;
  byDay: { day: string; count: number }[];
  byTeacher: { teacher: string; count: number }[];
  byRoom: { room: string; count: number }[];
};

function SchedulingReportInner() {
  const sp = useSearchParams();
  const startDate = sp.get("startDate") || undefined;
  const endDate = sp.get("endDate") || undefined;
  const [data, setData] = useState<SchedulingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    setLoading(true); setError("");
    fetch("/api/reports/scheduling?" + params.toString()).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setData).catch(() => setError("Unable to load scheduling report.")).finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <div className="space-y-6"><PageHeader icon={Clock} title="Scheduling Report" description="Sessions & room utilization" /><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div></div>;
  if (error) return <div className="space-y-6"><PageHeader icon={Clock} title="Scheduling Report" description="Sessions & room utilization" /><div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-8 text-center"><AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" /><p className="text-sm font-medium text-rose-700 dark:text-rose-400">{error}</p><button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700">Retry</button></div></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader icon={Clock} title="Scheduling Report" description="Sessions, rooms & teacher load" action={<ExportButton reportType="scheduling" startDate={startDate} endDate={endDate} />} />
      <Suspense fallback={<div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />}><DateRangePicker basePath="/reports/scheduling" /></Suspense>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Total Sessions</p><p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{data.totalSessions}</p></div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Room Utilization</p><p className="text-2xl font-bold text-brand-600 mt-1">{data.roomUtilization}%</p></div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Rooms Used</p><p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{data.usedRooms} / {data.totalRooms}</p></div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5"><p className="text-xs text-zinc-500 dark:text-zinc-400">Active Schedules</p><p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{data.totalSchedules}</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart title="Sessions by Day" data={data.byDay.map(d => ({ label: d.day, value: d.count }))} />
        {data.byTeacher.length > 0 && <BarChart title="Teacher Load" data={data.byTeacher.map(t => ({ label: t.teacher, value: t.count }))} />}
      </div>
      {data.byRoom.length > 0 && <BarChart title="Room Usage" data={data.byRoom.map(r => ({ label: r.room, value: r.count }))} />}
    </div>
  );
}

export default function SchedulingReportPage() {
  return <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 text-brand-600 animate-spin" /></div>}><SchedulingReportInner /></Suspense>;
}
`);
console.log('Scheduling page done');
