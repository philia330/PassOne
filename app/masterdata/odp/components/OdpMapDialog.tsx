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
      <div className="flex h-[300px] items-center justify-center rounded-2xl border bg-white text-slate-400">
        Memuat peta...
      </div>
    ),
  }
);

type OdpMapDialogProps = {
  odpNama: string;
  odpLat: number;
  odpLng: number;
  oltNama: string;
  oltLat: number;
  oltLng: number;
};

export const OdpMapDialog = ({
  odpNama,
  odpLat,
  odpLng,
  oltNama,
  oltLat,
  oltLng,
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
        className="cursor-pointer"
      >
        <MapPin className="h-4 w-4 text-sky-600" />
      </Button>

      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
  <span className="text-yellow-500">Jalur ODP: {odpNama}</span>
  {" — "}
  <span className="text-sky-400">OLT: {oltNama}</span>
</DialogTitle>
        </DialogHeader>

        {open && (
          <OdpRouteMap
            odpLat={odpLat}
            odpLng={odpLng}
            odpNama={odpNama}
            oltLat={oltLat}
            oltLng={oltLng}
            oltNama={oltNama}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};