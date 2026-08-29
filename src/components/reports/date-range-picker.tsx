"use client";

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
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          )}
        >
          {p.label}
        </button>
      ))}
      {showCustom && (
        <div className="flex items-center gap-2 ml-2">
          <input id="startDate" type="date" defaultValue={currentStart} className="px-2 py-1 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-900" />
          <span className="text-xs text-zinc-400">to</span>
          <input id="endDate" type="date" defaultValue={currentEnd} className="px-2 py-1 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-900" />
          <button onClick={applyCustom} className="px-3 py-1 text-xs font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700">Apply</button>
        </div>
      )}
    </div>
  );
}
