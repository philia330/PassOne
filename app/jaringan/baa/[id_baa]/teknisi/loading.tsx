export default function BaaTeknisiLoading() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-10 w-32 rounded-xl bg-slate-200" />
          <div className="h-6 w-20 rounded-full bg-slate-200" />
        </div>

        <div className="rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-48 rounded bg-slate-200" />
                <div className="h-6 w-20 rounded-full bg-slate-200" />
              </div>
              <div className="h-4 w-60 rounded bg-slate-100 mt-2" />
            </div>
            <div className="h-11 w-40 rounded-2xl bg-slate-200" />
          </div>
        </div>

        <div className="rounded-3xl shadow-xl border bg-white overflow-hidden">
          <div className="p-4 border-b">
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="h-3 w-64 rounded bg-slate-100 mt-1" />
          </div>

          <div className="bg-slate-50/80 h-11" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-6 py-4 border-t border-slate-100">
              <div className="h-4 w-6 rounded bg-slate-100" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-200" />
                <div className="h-4 w-24 rounded bg-slate-200" />
              </div>
              <div className="h-4 w-16 rounded bg-slate-100" />
              <div className="h-4 w-28 rounded bg-slate-100 ml-auto" />
              <div className="h-5 w-16 rounded-full bg-slate-200" />
              <div className="h-8 w-8 rounded-xl bg-slate-100" />
            </div>
          ))}

          <div className="p-4 border-t bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="h-3 w-16 rounded bg-slate-200" />
              </div>
              <div className="h-3 w-32 rounded bg-slate-200" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border shadow-sm p-4 text-center">
              <div className="h-7 w-12 mx-auto rounded bg-slate-200" />
              <div className="h-3 w-20 mx-auto rounded bg-slate-100 mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}