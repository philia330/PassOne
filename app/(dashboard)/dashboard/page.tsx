import Link from "next/link";
import NetworkMapLoader from "@/components/dashboard/network-map-loader";
import {
  Users,
  FileText,
  ClipboardCheck,
  Package,
  ArrowUpRight,
  Sparkles,
  Boxes,
  Router,
  PackageOpen,
  Wifi,
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
  const role = session?.user?.role;

  const [
    totalUser,
    totalFab,
    totalBaa,
    totalMaterial,
    totalOdp,
    totalOlt,
    totalOnt,
    totalPaket,
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
    prisma.odp.count(),
    prisma.olt.count(),
    prisma.ont.count(),
    prisma.paket.count(),
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

  // Tentukan card apa saja yang muncul berdasarkan role
  const canSeeAll = isAdmin;
  const canSeeSales = isAdmin || role === "SALES" || role === "LEADER" || role === "TEKNISI";
  const canSeeTeknisi = isAdmin || role === "TEKNISI" || role === "LEADER";
  const canSeeMasterData = isAdmin || role === "LEADER";

  const statistics = [
    // Admin & Leader bisa lihat semua statistik
    canSeeAll && {
      title: "Total User",
      value: totalUser,
      icon: Users,
      color: "bg-blue-500",
    },
    canSeeSales && {
      title: "Total FAB",
      value: totalFab,
      icon: FileText,
      color: "bg-emerald-500",
    },
    canSeeTeknisi && {
      title: "Total BAA",
      value: totalBaa,
      icon: ClipboardCheck,
      color: "bg-amber-500",
    },
    canSeeMasterData && {
      title: "Material",
      value: totalMaterial,
      icon: Package,
      color: "bg-purple-500",
    },
    canSeeMasterData && {
      title: "Total ODP",
      value: totalOdp,
      icon: Boxes,
      color: "bg-orange-500",
    },
    canSeeMasterData && {
      title: "Total OLT",
      value: totalOlt,
      icon: Router,
      color: "bg-cyan-500",
    },
    canSeeMasterData && {
      title: "Total ONT",
      value: totalOnt,
      icon: Wifi,
      color: "bg-pink-500",
    },
    canSeeMasterData && {
      title: "Total Paket",
      value: totalPaket,
      icon: PackageOpen,
      color: "bg-indigo-500",
    },
  ].filter(Boolean) as {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }[];

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Statistik */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
        {statistics.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:bg-slate-900 dark:shadow-none sm:p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                    {item.title}
                  </p>

                  <h2 className="mt-1 text-xl font-bold dark:text-white sm:text-2xl lg:text-3xl">
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
            fabOpen={slaAlerts.fabOpen}
            baaOpen={slaAlerts.baaOpen}
          />
        </div>
      </div>
    </div>
  );
}