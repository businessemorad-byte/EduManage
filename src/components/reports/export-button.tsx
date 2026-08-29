"use client";

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
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-colors disabled:opacity-50"
    >
      <Download className="h-3.5 w-3.5" />
      {exporting ? "Exporting..." : "Export CSV"}
    </button>
  );
}
