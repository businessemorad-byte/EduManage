"use client";

type BarData = { label: string; value: number };

export function BarChart({ data, title, maxValue }: { data: BarData[]; title?: string; maxValue?: number }) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
      {title && <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">{title}</h3>}
      {data.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-4">No data available</p>
      ) : (
        <div className="space-y-2.5">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 w-24 truncate text-right">{d.label}</span>
              <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-6 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: Math.max((d.value / max) * 100, d.value > 0 ? 8 : 0) + "%" }}
                >
                  {d.value > 0 && <span className="text-[10px] font-medium text-white">{d.value}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
