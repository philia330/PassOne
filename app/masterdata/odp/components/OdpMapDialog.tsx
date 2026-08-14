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

const OdpRouteMap = dynamic(
  () => import("./OdpRouteMap").then((mod) => mod.OdpRouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
        Memuat peta...
      </div>
    ),
  }
);

type OdpPoint = {
  id_odp: number;
  odpNama: string;
  odpLat: number;
  odpLng: number;
  oltNama: string;
  oltLat: number;
  oltLng: number;
};

type OdpMapDialogProps = {
  currentId: number;
  odpNama: string;
  allPoints: OdpPoint[];
};

export const OdpMapDialog = ({
  currentId,
  odpNama,
  allPoints,
}: OdpMapDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        title="Lihat Peta"
        className="cursor-pointer rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/30 group transition-all duration-200"
      >
        <MapPin className="h-4 w-4 text-sky-600 dark:text-sky-400 group-hover:scale-125 transition-transform duration-200" />
      </Button>

      <DialogContent className="rounded-3xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            <span className="text-slate-700 dark:text-slate-300">
              Peta Semua ODP
            </span>
            <span className="text-slate-400 dark:text-slate-500">
              {" "}— disorot: {odpNama}
            </span>
          </DialogTitle>
        </DialogHeader>

        {open && <OdpRouteMap points={allPoints} highlightId={currentId} />}
      </DialogContent>
    </Dialog>
  );
};