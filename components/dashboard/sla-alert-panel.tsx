import Link from "next/link";
import { AlertCircle, Clock } from "lucide-react";
import { getSlaSeverity, getDaysPending, SLA_COLORS } from "@/lib/sla";

type FabItem = { id_fab: number; kode_fab: string; nama_pelanggan: string; createdAt: Date };
type BaaItem = { id_baa: number; kode_baa: string; createdAt: Date };

export default function SlaAlertPanel({
  fabPending,
  baaPending,
}: {
  fabPending: FabItem[];
  baaPending: BaaItem[];
}) {
  const totalPending = fabPending.length + baaPending.length;

  if (totalPending === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900 dark:shadow-none">
        <div className="flex items-center gap-2">
          <Clock className="text-emerald-500" size={20} />
          <h2 className="text-lg font-bold dark:text-white">Status SLA</h2>
        </div>
        <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
          🎉 Tidak ada FAB/BAA yang tertunda. Semua tindak lanjut sudah aman.
        </p>
      </div>
    );
  }

return (
  <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 dark:shadow-none sm:p-6">

    {/* Header */}

    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">

      <div className="flex items-center gap-2">

        <AlertCircle
          className="text-amber-500"
          size={20}
        />

        <h2 className="text-lg font-bold dark:text-white">
          Status SLA
        </h2>

      </div>

      <span className="self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400 sm:ml-auto">
        {totalPending} Pending
      </span>

    </div>

    <div className="space-y-3">
{fabPending.map((fab) => {
  const severity = getSlaSeverity(fab.createdAt);
  const days = getDaysPending(fab.createdAt);
  const colors = SLA_COLORS[severity];

  return (
    <Link
      key={`fab-${fab.id_fab}`}
      href="/fab"
      className="block rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex min-w-0 items-start gap-3">

          <span
            className={`mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full ${colors.dot}`}
          />

          <div className="min-w-0 flex-1">

            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {fab.kode_fab}
            </p>

            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
              {fab.nama_pelanggan}
            </p>

            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              FAB • {days} hari menunggu
            </p>

          </div>

        </div>

        <span
          className={`self-start rounded-full px-3 py-1 text-xs font-semibold sm:self-center ${colors.bg} ${colors.text}`}
        >
          {colors.label}
        </span>

      </div>
    </Link>
  );
})}

{baaPending.map((baa) => {
  const severity = getSlaSeverity(baa.createdAt);
  const days = getDaysPending(baa.createdAt);
  const colors = SLA_COLORS[severity];

  return (
    <Link
      key={`baa-${baa.id_baa}`}
      href="/baa"
      className="block rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex min-w-0 items-start gap-3">

          <span
            className={`mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full ${colors.dot}`}
          />

          <div className="min-w-0 flex-1">

            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {baa.kode_baa}
            </p>

            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              BAA • {days} hari menunggu
            </p>

          </div>

        </div>

        <span
          className={`self-start rounded-full px-3 py-1 text-xs font-semibold sm:self-center ${colors.bg} ${colors.text}`}
        >
          {colors.label}
        </span>

      </div>
    </Link>
  );
})}

    </div>
  </div>
);
}