import Link from "next/link";
import NetworkMapLoader from "@/components/dashboard/network-map-loader";
import {
  Users,
  FileText,
  ClipboardCheck,
  Package,
} from "lucide-react";

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
import { RecentActivities } from "@/components/dashboard/RecentActivities";

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const role = session?.user?.role;

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

  // Tentukan card apa saja yang muncul berdasarkan role
  const canSeeAll = isAdmin;
  const canSeeSales = isAdmin || role === "SALES" || role === "LEADER" || role === "TEKNISI";
  const canSeeTeknisi = isAdmin || role === "TEKNISI" || role === "LEADER";
  const canSeeMasterData = isAdmin || role === "LEADER";

  const statistics = [
    canSeeAll && {
      title: "Total User",
      value: totalUser,
      icon: Users,
      color: "bg-blue-500",
      href: "/workspace?view=user",
    },
    canSeeSales && {
      title: "Total FAB",
      value: totalFab,
      icon: FileText,
      color: "bg-emerald-500",
      href: "/workspace?view=fab",
    },
    canSeeTeknisi && {
      title: "Total BAA",
      value: totalBaa,
      icon: ClipboardCheck,
      color: "bg-amber-500",
      href: "/workspace?view=baa",
    },
    canSeeMasterData && {
      title: "Material",
      value: totalMaterial,
      icon: Package,
      color: "bg-purple-500",
      href: "/workspace?view=material",
    },
  ].filter(Boolean) as {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    href: string;
  }[];

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Statistik */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statistics.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
              className="block rounded-2xl bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:bg-slate-900 dark:shadow-none sm:p-4"
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

                <div className={`${item.color} rounded-xl p-3 text-white sm:rounded-2xl sm:p-4`}>
                  <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                </div>
              </div>
            </Link>
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

          <RecentActivities activities={recentActivities} />
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