const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  INACTIVE: "bg-zinc-50 text-zinc-600 border-zinc-200",
  ARCHIVED: "bg-amber-50 text-amber-700 border-amber-200/60",
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  MAINTENANCE: "bg-amber-50 text-amber-700 border-amber-200/60",
  UNAVAILABLE: "bg-red-50 text-red-700 border-red-200/60",
  TRIAL: "bg-blue-50 text-blue-700 border-blue-200/60",
  PAST_DUE: "bg-amber-50 text-amber-700 border-amber-200/60",
  CANCELLED: "bg-red-50 text-red-700 border-red-200/60",
  EXPIRED: "bg-zinc-50 text-zinc-600 border-zinc-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200/60",
  WITHDRAWN: "bg-red-50 text-red-700 border-red-200/60",
  TRANSFERRED: "bg-purple-50 text-purple-700 border-purple-200/60",
  REPEATING: "bg-amber-50 text-amber-700 border-amber-200/60",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.INACTIVE;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}
