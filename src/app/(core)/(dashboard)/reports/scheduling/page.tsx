"use client";

import { useState, useEffect, Suspense } from "react";
import { Clock, Loader2, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
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

  if (loading) return <div className="space-y-6"><PageHeader icon={<Clock />} title="Scheduling Report" description="Sessions & room utilization" /><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-zinc-100 animate-pulse" />)}</div></div>;
  if (error) return <div className="space-y-6"><PageHeader icon={<Clock />} title="Scheduling Report" description="Sessions & room utilization" /><div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center"><AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" /><p className="text-sm font-medium text-rose-700">{error}</p><button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700">Retry</button></div></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader icon={<Clock />} title="Scheduling Report" description="Sessions, rooms & teacher load" action={<ExportButton reportType="scheduling" startDate={startDate} endDate={endDate} />} />
      <Suspense fallback={<div className="h-10 bg-zinc-100 rounded-lg animate-pulse" />}><DateRangePicker basePath="/reports/scheduling" /></Suspense>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5"><p className="text-xs text-zinc-500">Total Sessions</p><p className="text-2xl font-bold text-zinc-900 mt-1">{data.totalSessions}</p></div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5"><p className="text-xs text-zinc-500">Room Utilization</p><p className="text-2xl font-bold text-brand-600 mt-1">{data.roomUtilization}%</p></div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5"><p className="text-xs text-zinc-500">Rooms Used</p><p className="text-2xl font-bold text-zinc-900 mt-1">{data.usedRooms} / {data.totalRooms}</p></div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5"><p className="text-xs text-zinc-500">Active Schedules</p><p className="text-2xl font-bold text-zinc-900 mt-1">{data.totalSchedules}</p></div>
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
