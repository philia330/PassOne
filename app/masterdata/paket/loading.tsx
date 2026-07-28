import TableSkeleton from "@/components/shared/table-skeleton";

export default function PaketLoading() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Skeleton Header */}
        <div className="rounded-3xl shadow-xl border bg-white p-4 sm:p-6 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-slate-200" />
            <div className="space-y-2">
              <div className="h-5 w-32 sm:w-40 rounded bg-slate-200" />
              <div className="h-3 w-48 sm:w-56 rounded bg-slate-100" />
            </div>
          </div>
          <div className="h-11 w-28 sm:w-36 rounded-2xl bg-slate-200" />
        </div>

        <TableSkeleton rows={8} />
      </div>
    </div>
  );
}