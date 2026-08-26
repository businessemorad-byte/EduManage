import React from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  gradient?: "blue" | "green" | "purple" | "amber" | "rose" | "slate" | "violet";
};

const gradients = {
  blue: "from-brand-500 to-brand-600",
  green: "from-emerald-500 to-emerald-600",
  purple: "from-purple-500 to-purple-600",
  amber: "from-amber-500 to-amber-600",
  rose: "from-rose-500 to-rose-600",
  slate: "from-zinc-500 to-zinc-600",
  violet: "from-violet-500 to-violet-600",
};

export function StatCard({ label, value, subtitle, icon, trend, gradient = "blue" }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:shadow-md dark:border-zinc-700/50 dark:bg-zinc-800/80">
      <div className={`absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br ${gradients[gradient]} opacity-[0.07] transition-transform group-hover:scale-110`} />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {value}
            </p>
            {subtitle && (
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${gradients[gradient]} text-white shadow-sm`}>
              {icon}
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1.5">
            <span
              className={`text-xs font-semibold ${
                trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {trend.positive ? "+" : ""}{trend.value}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
}
