"use client";

import { useState } from "react";
import { Image as ImageIcon, ImageOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const FabImageDialog = ({
  fotoUrl,
  namaPelanggan,
  trigger,
}: {
  fotoUrl: string | null | undefined;
  namaPelanggan: string;
  trigger?: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);

  if (!fotoUrl) {
    if (trigger) return null;
    return (
      <span className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-500">
        <ImageOff className="h-4 w-4" />
        Tidak Ada
      </span>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={
          trigger
            ? "block w-full cursor-pointer text-left"
            : "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800"
        }
      >
        {trigger ?? (
          <>
            <ImageIcon className="h-4 w-4 text-purple-600 dark:text-fuchsia-400" />
            <span className="text-xs font-medium">Lihat</span>
          </>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">
            Foto Depan Rumah - {namaPelanggan}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 flex items-center justify-center overflow-auto rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
          <img
            src={fotoUrl}
            alt={namaPelanggan}
            className="max-h-[88vh] w-full rounded-xl object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};