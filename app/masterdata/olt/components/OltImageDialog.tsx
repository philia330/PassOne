"use client";

import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const OltImageDialog = ({
  fotoUrl,
  namaOlt,
}: {
  fotoUrl?: string | null;
  namaOlt: string;
}) => {
  const [open, setOpen] = useState(false);

  if (!fotoUrl) {
    return <span className="text-slate-400 dark:text-slate-500">-</span>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800">
        <ImageIcon className="h-4 w-4 text-purple-600 dark:text-fuchsia-400" />
        <span className="text-xs font-medium">Lihat</span>
      </DialogTrigger>

      {/* 🚀 max-w diperbesar menjadi max-w-3xl (sm:max-w-4xl) */}
      <DialogContent className="max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">
            Foto OLT - {namaOlt}
          </DialogTitle>
        </DialogHeader>

        {/* 🚀 max-h diperbesar ke 85vh agar foto tampil lega di layar */}
        <div className="mt-2 flex items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
          <img
            src={fotoUrl}
            alt={namaOlt}
            className="max-h-[85vh] w-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}; 