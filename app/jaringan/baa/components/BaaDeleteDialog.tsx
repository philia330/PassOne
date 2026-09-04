"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { deleteBaa, deleteMultipleBaa } from "@/app/jaringan/baa/actions";

interface BaaDeleteDialogProps {
  id?: number;
  kodeBaa?: string;
  bulkIds?: number[];
  // ============================================================
  // MODE TERKONTROL (dipakai dari BaaTable/dropdown aksi) --
  // kalau "open" dikasih, tombol trigger sendiri (ikon sampah) TIDAK
  // dirender lagi, buka/tutup sepenuhnya dikendalikan dari luar.
  // ============================================================
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDeleteStart?: () => void;
}

export const BaaDeleteDialog = ({
  id,
  kodeBaa,
  bulkIds,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  onDeleteStart,
}: BaaDeleteDialogProps) => {
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);

  const open = isControlled ? openProp : internalOpen;
  const setOpen = isControlled ? (onOpenChangeProp ?? (() => {})) : setInternalOpen;

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isBulk = bulkIds && bulkIds.length > 0;
  const itemCount = isBulk ? bulkIds.length : 1;

  const handleConfirm = () => {
    onDeleteStart?.();
    startTransition(async () => {
      try {
        if (isBulk && bulkIds) {
          await deleteMultipleBaa(bulkIds);
          toast.success(`Berhasil menghapus ${bulkIds.length} data BAA`);
        } else if (id) {
          await deleteBaa(id);
          toast.success("Data BAA berhasil dihapus");
        }
        setOpen(false);
        router.refresh();
      } catch (err: unknown) {
        const error = err as Error;
        toast.error(error.message ?? "Gagal menghapus BAA");
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer rounded-xl active:scale-90 transition-transform hover:bg-rose-50 dark:hover:bg-rose-950/30"
            />
          }
        >
          <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600 active:scale-90 transition-all dark:text-red-400 dark:hover:text-red-300" />
        </AlertDialogTrigger>
      )}

      <AlertDialogContent
        className="
          flex h-full max-h-[100dvh] w-full max-w-full flex-col
          overflow-hidden rounded-none bg-white text-slate-900
          dark:bg-slate-900 dark:text-slate-50
          sm:h-auto sm:max-h-[90vh] sm:max-w-[400px] sm:rounded-3xl
        "
      >
        <AlertDialogHeader className="!items-center !text-center sm:!text-center w-full flex-shrink-0 px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="group relative mb-2 mx-auto h-20 w-20 cursor-pointer">
            <span className="absolute inset-0 rounded-full bg-red-400 opacity-0 group-hover:opacity-60 group-hover:animate-ping" />
            <div className="relative h-20 w-20 rounded-full bg-red-50 flex items-center justify-center transition-all duration-300 group-hover:bg-red-100 group-hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]">
              <TriangleAlert
                className="text-red-600 transition-transform duration-300 group-hover:scale-110"
                size={38}
              />
            </div>
          </div>

          <AlertDialogTitle className="w-full text-center text-lg font-bold text-slate-900 dark:text-slate-50">
            {isBulk ? `Hapus ${itemCount} data BAA?` : "Hapus data BAA ini?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="w-full text-center text-sm leading-relaxed text-slate-500 dark:text-slate-300">
            {isBulk ? (
              <>
                Kamu akan menghapus <strong className="text-slate-700 dark:text-slate-100">{itemCount} data BAA</strong>{" "}
                beserta seluruh daftar material di dalamnya. Data yang sudah dihapus tidak bisa dikembalikan.
              </>
            ) : (
              <>
                Kamu akan menghapus BAA{" "}
                <strong className="text-slate-700 dark:text-slate-100">&quot;{kodeBaa}&quot;</strong> beserta seluruh
                daftar material di dalamnya. Data yang sudah dihapus tidak bisa dikembalikan.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex-1" />

        <AlertDialogFooter className="sm:justify-center gap-2 mt-2 flex-shrink-0 px-4 pb-4 sm:px-6 sm:pb-6">
          <AlertDialogCancel disabled={isPending} className="h-11 flex-1 rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="rounded-2xl h-11 flex-1 bg-red-600 hover:bg-red-700 font-semibold active:scale-95 transition-transform"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Menghapus..." : "Ya, Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
