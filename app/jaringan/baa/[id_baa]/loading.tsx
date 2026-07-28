export default function BaaDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto animate-pulse">
        {/* Tombol Kembali */}
        <div className="h-10 w-32 rounded-xl bg-slate-200" />

        {/* Header */}
        <div className="rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-40 rounded bg-slate-200" />
                <div className="h-6 w-20 rounded-full bg-slate-200" />
              </div>
              <div className="h-4 w-60 rounded bg-slate-100 mt-2" />
            </div>
            <div className="h-10 w-20 rounded-xl bg-slate-200" />
          </div>
        </div>

        {/* Grid Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
            <div className="h-4 w-40 rounded bg-slate-200 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-20 rounded bg-slate-100" />
                  <div className="h-4 w-32 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
            <div className="h-4 w-40 rounded bg-slate-200 mb-4" />
            <div className="space-y-3">
              <div className="h-16 rounded-xl bg-slate-100" />
              <div className="h-12 rounded-xl bg-slate-50" />
            </div>
          </div>
        </div>

        {/* Perangkat */}
        <div className="rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
          <div className="h-4 w-40 rounded bg-slate-200 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-slate-50 p-3 text-center">
                <div className="h-3 w-12 mx-auto rounded bg-slate-200" />
                <div className="h-4 w-20 mx-auto rounded bg-slate-200 mt-1" />
                <div className="h-3 w-16 mx-auto rounded bg-slate-100 mt-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Material */}
        <div className="rounded-3xl shadow-xl border bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="h-5 w-16 rounded bg-slate-200" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="h-4 w-12 rounded bg-slate-100" />
                <div className="h-4 w-20 rounded bg-slate-100 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}