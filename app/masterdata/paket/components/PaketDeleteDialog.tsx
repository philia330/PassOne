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
import { deletePaket } from "@/app/masterdata/paket/actions";

interface PaketDeleteDialogProps {
  id: number;
  namaPaket: string;
  bulkIds?: number[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDeleteStart?: () => void;
}

export const PaketDeleteDialog = ({ id, namaPaket, bulkIds, open: controlledOpen, onOpenChange, onDeleteStart }: PaketDeleteDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  const isBulk = bulkIds && bulkIds.length > 0;

  const handleConfirm = () => {
    setErrorMsg(null);
    onDeleteStart?.();
    startTransition(async () => {
      try {
        if (isBulk && bulkIds) {
          const response = await fetch(`/api/paket/bulk-delete?ids=${bulkIds.join(",")}`, {
            method: "DELETE",
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Gagal menghapus data");
          }
          toast.success(`Berhasil menghapus ${bulkIds.length} data Paket`);
        } else {
          await deletePaket(id);
          toast.success("Data Paket berhasil dihapus");
        }
        setIsOpen(false);
        router.refresh();
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(error.message ?? "Gagal menghapus data, coba lagi.");
        toast.error(error.message ?? "Gagal menghapus data");
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(isOpen) => {
      setIsOpen(isOpen);
      if (!isOpen) setErrorMsg(null);
    }}>
      <AlertDialogTrigger
  render={
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 cursor-pointer rounded-xl active:scale-90 hover:scale-125 transition-transform hover:bg-rose-50 dark:hover:bg-rose-950/30"
    />
  }
>
        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600 active:scale-90 transition-all dark:text-red-400 dark:hover:text-red-300" />
      </AlertDialogTrigger>

      <AlertDialogContent
        className="
          flex h-full max-h-[100dvh] w-full max-w-full flex-col
          overflow-hidden rounded-none
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
            {isBulk ? `Hapus ${bulkIds?.length} Paket ini?` : "Hapus paket ini?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="w-full text-center text-sm leading-relaxed text-slate-500 dark:text-slate-300">
            {isBulk ? (
              <>Kamu akan menghapus <strong className="text-slate-700 dark:text-slate-100">{bulkIds?.length} Paket</strong> yang dipilih. Data yang sudah dihapus tidak bisa dikembalikan.</>
            ) : (
              <>Kamu akan menghapus paket <strong className="text-slate-700 dark:text-slate-100">&quot;{namaPaket}&quot;</strong>. Data yang sudah dihapus tidak bisa dikembalikan.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorMsg && (
          <p className="mx-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:bg-red-950/30 dark:text-red-300 sm:mx-6">
            {errorMsg}
          </p>
        )}

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
