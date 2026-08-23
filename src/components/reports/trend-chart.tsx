"use client";

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
