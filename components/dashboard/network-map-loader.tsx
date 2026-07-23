"use client";

import dynamic from "next/dynamic";
import type { NetworkPoint } from "@/lib/network-points";

const NetworkMap = dynamic(() => import("@/components/dashboard/network-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-sm text-slate-400">
      Memuat peta...
    </div>
  ),
});

export default function NetworkMapLoader({ points }: { points: NetworkPoint[] }) {
  return <NetworkMap points={points} />;
}