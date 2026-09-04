"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Leaflet butuh akses `window`, jadi harus di-load tanpa SSR
const SingleMarkerMap = dynamic(
  () => import("./SingleMarkerMap").then((mod) => mod.SingleMarkerMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
        Memuat peta...
      </div>
    ),
  }
);

type PopMapDialogProps = {
  nama: string;
  lat: number;
  lng: number;
};

export const PopMapDialog = ({ nama, lat, lng }: PopMapDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        title="Lihat Peta"
        className="group cursor-pointer rounded-xl active:scale-90 transition-transform hover:bg-sky-50 dark:hover:bg-sky-500/20"
      >
        <MapPin className="h-4 w-4 text-sky-600 transition-transform duration-200 group-hover:scale-125 dark:text-sky-400" />
      </Button>

      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-purple-600 dark:text-purple-400">
            Lokasi POP: {nama}
          </DialogTitle>
        </DialogHeader>

        {open && <SingleMarkerMap lat={lat} lng={lng} nama={nama} />}
      </DialogContent>
    </Dialog>
  );
};