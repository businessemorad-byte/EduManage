const fs = require('fs');
const path = require('path');
const base = 'C:/Users/3imra/Desktop/Edu Manage';

function w(rel, content) {
  fs.writeFileSync(path.join(base, rel), content);
  console.log('Wrote: ' + rel);
}

// Bar Chart Component
w('src/components/reports/bar-chart.tsx', `"use client";

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
`);

// Simple trend line (SVG)
w('src/components/reports/trend-chart.tsx', `"use client";

type TrendData = { label: string; value: number };

export function TrendChart({ data, title, color = "#3b82f6" }: { data: TrendData[]; title?: string; color?: string }) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
        {title && <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">{title}</h3>}
        <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-8">No trend data available</p>
      </div>
    );
  }

  const max = Math.max(...data.map(d => d.value), 1);
  const width = 400;
  const height = 120;
  const padX = 10;
  const padY = 10;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;

  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * usableW;
    const y = padY + usableH - (d.value / max) * usableH;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => (i === 0 ? "M" : "L") + p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ");
  const areaD = pathD + " L" + points[points.length - 1].x.toFixed(1) + "," + (height - padY) + " L" + points[0].x.toFixed(1) + "," + (height - padY) + " Z";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
      {title && <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">{title}</h3>}
      <svg viewBox={"0 0 " + width + " " + height} className="w-full h-32">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#areaGrad)" />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke="white" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-2">
        {points.map((p, i) => (
          <span key={i} className="text-[9px] text-zinc-400 dark:text-zinc-500 truncate max-w-[60px]">{p.label}</span>
        ))}
      </div>
    </div>
  );
}
`);

// Date Range Picker
w('src/components/reports/date-range-picker.tsx', `"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

const PRESETS = [
  { label: "All Time", value: "" },
  { label: "This Month", value: "month" },
  { label: "Last Month", value: "lastMonth" },
  { label: "This Quarter", value: "quarter" },
  { label: "This Year", value: "year" },
  { label: "Custom", value: "custom" },
];

function getPresetRange(preset: string): { startDate?: string; endDate?: string } {
  const now = new Date();
  if (preset === "month") return { startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10) };
  if (preset === "lastMonth") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
  }
  if (preset === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    return { startDate: new Date(now.getFullYear(), q * 3, 1).toISOString().slice(0, 10) };
  }
  if (preset === "year") return { startDate: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10) };
  return {};
}

export function DateRangePicker({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStart = searchParams.get("startDate") || "";
  const currentEnd = searchParams.get("endDate") || "";
  const [activePreset, setActivePreset] = useState(!currentStart && !currentEnd ? "" : "custom");
  const [showCustom, setShowCustom] = useState(activePreset === "custom");

  function applyPreset(preset: string) {
    setActivePreset(preset);
    if (preset === "custom") { setShowCustom(true); return; }
    setShowCustom(false);
    const range = getPresetRange(preset);
    const params = new URLSearchParams();
    if (range.startDate) params.set("startDate", range.startDate);
    if (range.endDate) params.set("endDate", range.endDate);
    router.push(basePath + (params.toString() ? "?" + params.toString() : ""));
  }

  function applyCustom() {
    const params = new URLSearchParams();
    const s = (document.getElementById("startDate") as HTMLInputElement)?.value;
    const e = (document.getElementById("endDate") as HTMLInputElement)?.value;
    if (s) params.set("startDate", s);
    if (e) params.set("endDate", e);
    router.push(basePath + (params.toString() ? "?" + params.toString() : ""));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Calendar className="h-4 w-4 text-zinc-400" />
      {PRESETS.map(p => (
        <button
          key={p.value}
          onClick={() => applyPreset(p.value)}
          className={"px-3 py-1.5 text-xs font-medium rounded-lg transition-colors " + (
            activePreset === p.value
              ? "bg-brand-600 text-white"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          )}
        >
          {p.label}
        </button>
      ))}
      {showCustom && (
        <div className="flex items-center gap-2 ml-2">
          <input id="startDate" type="date" defaultValue={currentStart} className="px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white" />
          <span className="text-xs text-zinc-400">to</span>
          <input id="endDate" type="date" defaultValue={currentEnd} className="px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white" />
          <button onClick={applyCustom} className="px-3 py-1 text-xs font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700">Apply</button>
        </div>
      )}
    </div>
  );
}
`);

// Export Button
w('src/components/reports/export-button.tsx', `"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export function ExportButton({ reportType, startDate, endDate }: { reportType: string; startDate?: string; endDate?: string }) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams({ type: reportType });
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await fetch("/api/reports/export?" + params.toString());
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = reportType + "-report.csv";
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors disabled:opacity-50"
    >
      <Download className="h-3.5 w-3.5" />
      {exporting ? "Exporting..." : "Export CSV"}
    </button>
  );
}
`);

console.log('All components written');
