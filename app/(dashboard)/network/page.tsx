import { PageHeader } from "@/components/layout/PageHeader";
import { auth } from "@/lib/auth";
import { getNetworkPoints } from "@/lib/network-points";
import NetworkMapLoader from "@/components/dashboard/network-map-loader";

export default async function NetworkMapPage() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const networkPoints = await getNetworkPoints();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Compact Header - smaller height */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          Peta Jaringan
        </h1>
      </div>

      {/* Map - Takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <NetworkMapLoader points={networkPoints} fullHeight />
      </div>
    </div>
  );
}
