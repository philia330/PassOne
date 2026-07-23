import Link from "next/link";
import NetworkMapLoader from "@/components/dashboard/network-map-loader";
import {
  Users,
 FileText,
  ClipboardCheck,
  Package,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  getMonthlyTrend,
  getStatusBreakdown,
  getSlaAlerts,
  getPeriodComparison,
} from "@/lib/dashboard-stats";
import { getNetworkPoints } from "@/lib/network-points";
import FabBaaChart from "@/components/dashboard/fab-baa-chart";
import SlaAlertPanel from "@/components/dashboard/sla-alert-panel";

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const [
    totalUser,
    totalFab,
    totalBaa,
    totalMaterial,
    recentActivities,
    monthlyTrend,
    statusBreakdown,
    networkPoints,
    slaAlerts,
    periodComparison,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.fab.count(),
    prisma.baa.count(),
    prisma.material.count(),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    getMonthlyTrend(),
    getStatusBreakdown(),
    getNetworkPoints(),
    getSlaAlerts(),
    getPeriodComparison(),
  ]);

  const statistics = [
    {
      title: "Total User",
      value: totalUser,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Total FAB",
      value: totalFab,
      icon: FileText,
      color: "bg-emerald-500",
    },
    {
      title: "Total BAA",
      value: totalBaa,
      icon: ClipboardCheck,
      color: "bg-amber-500",
    },
    {
      title: "Material",
      value: totalMaterial,
      icon: Package,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Statistik */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:gap-6 xl:grid-cols-4">
        {statistics.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:bg-slate-900 dark:shadow-none sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                    {item.title}
                  </p>

                  <h2 className="mt-1 text-2xl font-bold dark:text-white sm:mt-2 sm:text-4xl">
                    {item.value}
                  </h2>
                </div>

                <div
                    className={`${item.color} rounded-xl p-3 text-white sm:rounded-2xl sm:p-4`}
                  >
                  <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <FabBaaChart
        initialMonthly={monthlyTrend}
        fabStatus={statusBreakdown.fab}
        baaStatus={statusBreakdown.baa}
        comparison={periodComparison}
      />

      {/* Map */}
      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 dark:shadow-none sm:p-6">
        <h2 className="mb-4 text-lg font-bold dark:text-white">
          Peta Sebaran Jaringan
        </h2>

        <NetworkMapLoader points={networkPoints} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 xl:gap-8">
        {/* Aktivitas */}
        <div
          className={`rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 dark:shadow-none sm:p-6 ${
            isAdmin ? "lg:col-span-1" : "lg:col-span-2"
          }`}
        >
          <h2 className="mb-5 text-lg font-bold dark:text-white sm:text-xl">
            Aktivitas Terbaru
          </h2>

          <div className="space-y-4">
            {recentActivities.length === 0 && (
              <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10">
                  <Sparkles
                    className="text-indigo-400"
                    size={28}
                  />
                </div>

                <p className="font-medium text-slate-600 dark:text-slate-300">
                  Belum ada aktivitas
                </p>

                <p className="mt-1 max-w-xs text-sm text-slate-400 dark:text-slate-500">
                  Aktivitas seperti penambahan user, FAB, atau BAA akan muncul
                  di sini secara otomatis.
                </p>
              </div>
            )}

            {recentActivities.map((activity) => (
              <div
                key={activity.id_log}
                className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium dark:text-slate-100">
                    {activity.description}
                  </p>

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDistanceToNow(activity.createdAt, {
                      addSuffix: true,
                      locale: localeId,
                    })}
                  </p>
                </div>

                <ArrowUpRight
                  className="mt-1 h-4 w-4 flex-shrink-0 text-slate-400 dark:text-slate-600"
                />
              </div>
            ))}
          </div>
        </div>

        {/* SLA */}
        <div className="lg:col-span-1">
          <SlaAlertPanel
            fabPending={slaAlerts.fabPending}
            baaPending={slaAlerts.baaPending}
          />
        </div>

        {/* Quick Action */}
        {isAdmin && (
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 dark:shadow-none sm:p-6 lg:col-span-1">
           <h2 className="mb-5 text-lg font-bold dark:text-white sm:text-xl">
              Quick Action
            </h2>

            <div className="space-y-4">
              <Link
                href="/masterdata/user"
                className="block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-indigo-700 sm:text-base"
              >
                + Tambah User
              </Link>

              <Link
                href="/fab"
                className="block w-full rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-indigo-700 sm:text-base"
              >
                + Buat FAB
              </Link>

              <Link
                href="/baa"
                className="block w-full rounded-xl bg-amber-600 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-indigo-700 sm:text-base"
              >
                + Buat BAA
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}