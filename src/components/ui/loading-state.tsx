export function LoadingState({ message = "Chargement..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-16">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full border-2 border-brand-100" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand-600" />
        </div>
        <p className="text-sm text-zinc-400">{message}</p>
      </div>
    </div>
  );
}
