import {
  Users,
  DollarSign,
  CalendarCheck,
  TrendingUp,
  Bell,
  BarChart3,
  Search,
  BookOpen,
  Clock,
  UserCheck,
  GraduationCap,
  CreditCard,
} from "lucide-react";
import type { LandingProps } from "./i18n-props";

const sidebarIcons = [BarChart3, Users, GraduationCap, BookOpen, CalendarCheck, CreditCard, Bell];
const statIcons = [Users, DollarSign, CalendarCheck, TrendingUp];
const activityIcons = [UserCheck, CreditCard, Clock];

export default function DashboardMockup({ dict }: LandingProps) {
  const m = dict.hero.mockup;

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-200/50">
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50/80 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="ml-4 flex flex-1 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1">
          <Search className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-xs text-zinc-400">{m.searchPlaceholder}</span>
        </div>
        <Bell className="h-4 w-4 text-zinc-400" />
        <div className="h-6 w-6 rounded-full bg-brand-100 text-center leading-6 text-xs font-semibold text-brand-700">
          A
        </div>
      </div>

      <div className="flex">
        <div className="hidden w-48 shrink-0 border-r border-zinc-100 bg-zinc-50/50 p-3 lg:block">
          <div className="space-y-0.5">
            {m.sidebar.map((label, i) => {
              const Icon = sidebarIcons[i] ?? BarChart3;
              return (
                <div
                  key={label}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium ${
                    i === 0
                      ? "bg-brand-50 text-brand-700"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 p-4 lg:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">EduManage</h3>
              <p className="text-xs text-zinc-500">{m.overview}</p>
            </div>
            <div className="flex gap-2">
              <select className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600">
                <option>{m.period}</option>
              </select>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {m.stats.map((stat, i) => {
              const Icon = statIcons[i] ?? BarChart3;
              return (
                <div key={stat.label} className="rounded-lg border border-zinc-100 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-md ${colorFor(i)}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] font-medium text-emerald-600">{stat.change}</span>
                  </div>
                  <p className="text-lg font-bold text-zinc-900">
                    {stat.prefix && <span className="text-xs font-medium text-zinc-500">{stat.prefix} </span>}
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-zinc-500">{stat.label}</p>
                </div>
              );
            })}
          </div>

          <div className="mb-4 grid gap-3 lg:grid-cols-5">
            <div className="rounded-lg border border-zinc-100 bg-white p-3 lg:col-span-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-700">{m.revenueLabel}</p>
                <span className="text-[10px] text-zinc-400">{m.lastSixMonths}</span>
              </div>
              <div className="flex items-end gap-1.5" style={{ height: 80 }}>
                {[40, 55, 45, 65, 50, 78].map((h, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={`animate-grow-bar w-full rounded-sm ${i === 5 ? "bg-brand-500" : "bg-brand-100"}`}
                      style={{
                        height: `${h}%`,
                        animationDelay: `${i * 120}ms`,
                        transformOrigin: "bottom",
                      }}
                    />
                    <span className="text-[9px] text-zinc-400">{m.months[i]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-100 bg-white p-3 lg:col-span-2">
              <p className="mb-3 text-xs font-semibold text-zinc-700">{m.activityLabel}</p>
              <div className="space-y-2.5">
                {m.activities.map((item, i) => {
                  const Icon = activityIcons[i] ?? Clock;
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${activityColor(i)}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] text-zinc-700">{item.text}</p>
                        <p className="text-[10px] text-zinc-400">{item.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-100 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-700">{m.studentsLabel}</p>
              <a href="#" className="text-[10px] font-medium text-brand-600 hover:text-brand-700">
                {m.viewAll}
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-zinc-100">
                    {m.tableHeaders.map((h) => (
                      <th key={h} className="pb-1.5 font-medium text-zinc-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {m.rows.map((s) => (
                    <tr key={s.name}>
                      <td className="py-1.5 font-medium text-zinc-800">{s.name}</td>
                      <td className="py-1.5 text-zinc-600">{s.group}</td>
                      <td className="py-1.5">
                        <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                          {s.presence}
                        </span>
                      </td>
                      <td className="py-1.5 text-zinc-500">{s.payment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const colorFor = (i: number) =>
  ["text-brand-600 bg-brand-50", "text-emerald-600 bg-emerald-50", "text-violet-600 bg-violet-50", "text-amber-600 bg-amber-50"][i % 4];

const activityColor = (i: number) =>
  ["text-emerald-500", "text-brand-500", "text-amber-500"][i % 3];