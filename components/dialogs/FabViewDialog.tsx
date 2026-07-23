"use client";

import dynamic from "next/dynamic";
import { Eye, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { FabData } from "@/types/fab";

const LocationPickerMap = dynamic(() => import("@/components/shared/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] w-full rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400">
      Memuat peta...
    </div>
  ),
});

interface FabViewDialogProps {
  fab: FabData;
}

export const FabViewDialog = ({ fab }: FabViewDialogProps) => {
  const lat = Number(fab.latitude);
  const lng = Number(fab.longitude);
  const hasValidCoords = !Number.isNaN(lat) && !Number.isNaN(lng);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="rounded-3xl sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin size={18} className="text-purple-500" />
            Lokasi {fab.nama_pelanggan}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            {fab.kode_fab} &middot; {fab.alamat}
          </p>

          {hasValidCoords ? (
            <LocationPickerMap lat={lat} lng={lng} height="360px" readOnly />
          ) : (
            <div className="h-[360px] w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
              Koordinat lokasi belum tersedia
            </div>
          )}

          <p className="text-xs text-slate-400 font-mono text-center">
            {hasValidCoords ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "-"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};