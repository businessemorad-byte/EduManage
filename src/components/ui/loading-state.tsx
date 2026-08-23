export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-16">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full border-2 border-brand-100 dark:border-brand-900/30" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand-600 dark:border-t-brand-400" />
        </div>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">{message}</p>
      </div>
    </div>
  );
}
