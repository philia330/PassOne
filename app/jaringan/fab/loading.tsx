export default function FabLoading() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">

        <div className="rounded-3xl shadow-xl border bg-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-slate-200" />
            <div className="space-y-2">
              <div className="h-5 w-32 rounded bg-slate-200" />
              <div className="h-3 w-64 rounded bg-slate-100" />
            </div>
          </div>
          <div className="h-11 w-32 rounded-2xl bg-slate-200" />
        </div>

        <div className="rounded-3xl shadow-xl border bg-white p-4 flex items-center justify-between">
          <div className="h-12 w-72 rounded-2xl bg-slate-100" />
          <div className="h-12 w-28 rounded-2xl bg-slate-200" />
        </div>

        <div className="rounded-3xl shadow-xl border bg-white overflow-hidden">
          <div className="bg-slate-50/80 h-11" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-6 py-4 border-t border-slate-100">
              <div className="h-3 w-4 rounded bg-slate-100" />
              <div className="h-5 w-16 rounded-md bg-slate-100" />
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-4 w-24 rounded bg-slate-100" />
              <div className="h-4 w-20 rounded bg-slate-100" />
              <div className="h-4 w-16 rounded bg-slate-100" />
              <div className="h-5 w-16 rounded-full bg-slate-100 ml-auto" />
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded-xl bg-slate-100" />
                <div className="h-8 w-8 rounded-xl bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}