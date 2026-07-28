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
    <div className="h-[280px] sm:h-[360px] w-full rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400">
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
        <Button variant="outline" size="sm" className="rounded-xl w-full sm:w-auto">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent
        className="
          flex h-full max-h-[100dvh] w-full max-w-full flex-col
          overflow-hidden rounded-none p-0
          sm:h-auto sm:max-h-[90vh] sm:max-w-[600px] sm:rounded-3xl sm:p-6
        "
      >
        <DialogHeader className="flex-shrink-0 px-4 pt-4 sm:px-0 sm:pt-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MapPin size={18} className="text-purple-500 flex-shrink-0" />
            <span className="truncate">Lokasi {fab.nama_pelanggan}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-0 py-4">
          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-slate-500">
              {fab.kode_fab} &middot; {fab.alamat}
            </p>

            {hasValidCoords ? (
              <LocationPickerMap lat={lat} lng={lng} height="280px" readOnly />
            ) : (
              <div className="h-[280px] w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                Koordinat lokasi belum tersedia
              </div>
            )}

            <p className="text-xs text-slate-400 font-mono text-center">
              {hasValidCoords ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "-"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};