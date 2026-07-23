export default function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Statistik cards */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                <div className="h-8 w-12 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="h-14 w-14 animate-pulse rounded-2xl bg-slate-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl bg-white shadow-sm lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>

      {/* Map */}
      <div className="h-96 animate-pulse rounded-2xl bg-white shadow-sm" />
    </div>
  );
}