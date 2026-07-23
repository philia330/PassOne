export default function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-200" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
        </div>

        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-slate-50 px-6 py-4 last:border-0"
          >
            <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}