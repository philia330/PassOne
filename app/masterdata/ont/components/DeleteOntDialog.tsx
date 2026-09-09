"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Loader2,
  TriangleAlert,
} from "lucide-react";

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

import { toast } from "sonner";

import { deleteOnt } from "../actions";

interface DeleteOntDialogProps {
  id: number;
  name: string;
  bulkIds?: number[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDeleteStart?: () => void;
}

export const DeleteOntDialog = ({
  id,
  name,
  bulkIds,
  open: controlledOpen,
  onOpenChange,
  onDeleteStart,
}: DeleteOntDialogProps) => {
  const [internalOpen, setInternalOpen] =
    useState(false);

  const [isPending, startTransition] =
    useTransition();

  const [errorMsg, setErrorMsg] =
    useState<string | null>(null);

  const router = useRouter();

  /*
   * ============================================
   * CONTROLLED / UNCONTROLLED DIALOG
   * ============================================
   */
  const isControlled =
    controlledOpen !== undefined;

  const isOpen = isControlled
    ? controlledOpen
    : internalOpen;

  const setIsOpen = isControlled
    ? onOpenChange!
    : setInternalOpen;

  /*
   * ============================================
   * CEK BULK DELETE
   * ============================================
   */
  const isBulk =
    Array.isArray(bulkIds) &&
    bulkIds.length > 0;

  /*
   * ============================================
   * HANDLE CONFIRM DELETE
   * ============================================
   */
  const handleConfirm = () => {
    setErrorMsg(null);

    onDeleteStart?.();

    startTransition(async () => {
      try {
        /*
         * ======================================
         * BULK DELETE
         * ======================================
         */
        if (isBulk && bulkIds) {
          const response = await fetch(
            `/api/ont/bulk-delete?ids=${bulkIds.join(",")}`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok) {
            const error =
              await response.json();

            throw new Error(
              error.message ||
                "Gagal menghapus data ONT."
            );
          }

          toast.success(
            `Berhasil menghapus ${bulkIds.length} data ONT`
          );
        } else {
          /*
           * ======================================
           * SINGLE DELETE
           * ======================================
           *
           * deleteOnt() di server sudah melakukan:
           *
           * 1. Cek login
           * 2. Cek role ADMIN
           * 3. Cek ONT
           * 4. Cek status TERPASANG
           * 5. Cek relasi BAA
           */
          await deleteOnt(id);

          toast.success(
            "Data ONT berhasil dihapus"
          );
        }

        /*
         * Tutup dialog
         */
        setIsOpen(false);

        /*
         * Refresh data
         */
        router.refresh();
      } catch (err: unknown) {
        const error = err as Error;

        const message =
          error.message ||
          "Gagal menghapus ONT, coba lagi.";

        setErrorMsg(message);

        toast.error(message);
      }
    });
  };

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(newOpen) => {
        setIsOpen(newOpen);

        if (!newOpen) {
          setErrorMsg(null);
        }
      }}
    >
      {/* =========================================
          TRIGGER DELETE
          Hanya muncul untuk single delete.
      ========================================== */}
      {!isBulk && (
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="
                cursor-pointer
                rounded-xl
                transition-transform
                duration-200
                hover:scale-125
                hover:bg-rose-50
                active:scale-90
                dark:hover:bg-rose-950/30
              "
            />
          }
        >
          <Trash2
            className="
              h-4 w-4
              text-red-500
              transition-all
              hover:text-red-600
              active:scale-90
              dark:text-red-400
              dark:hover:text-red-300
            "
          />
        </AlertDialogTrigger>
      )}

      {/* =========================================
          DIALOG CONTENT
      ========================================== */}
      <AlertDialogContent
        className="
          flex
          h-full
          max-h-[100dvh]
          w-full
          max-w-full
          flex-col
          overflow-hidden
          rounded-none
          sm:h-auto
          sm:max-h-[90vh]
          sm:max-w-[400px]
          sm:rounded-3xl
        "
      >
        <AlertDialogHeader
          className="
            w-full
            flex-shrink-0
            px-4
            pt-4
            text-center
            !items-center
            sm:px-6
            sm:pt-6
            sm:text-center
          "
        >
          {/* =====================================
              WARNING ICON
          ====================================== */}
          <div className="group relative mx-auto mb-2 h-20 w-20 cursor-pointer">
            <span
              className="
                absolute
                inset-0
                rounded-full
                bg-red-400
                opacity-0
                group-hover:animate-ping
                group-hover:opacity-60
              "
            />

            <div
              className="
                relative
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-full
                bg-red-50
                transition-all
                duration-300
                group-hover:bg-red-100
                group-hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]
              "
            >
              <TriangleAlert
                className="
                  text-red-600
                  transition-transform
                  duration-300
                  group-hover:scale-110
                "
                size={38}
              />
            </div>
          </div>

          {/* =====================================
              TITLE
          ====================================== */}
          <AlertDialogTitle
            className="
              w-full
              text-center
              text-lg
              font-bold
              text-slate-900
              dark:text-slate-50
            "
          >
            {isBulk
              ? `Hapus ${bulkIds?.length} ONT ini?`
              : "Hapus ONT ini?"}
          </AlertDialogTitle>

          {/* =====================================
              DESCRIPTION
          ====================================== */}
          <AlertDialogDescription
            className="
              w-full
              text-center
              text-sm
              leading-relaxed
              text-slate-500
              dark:text-slate-300
            "
          >
            {isBulk ? (
              <>
                Kamu akan menghapus{" "}
                <strong className="text-slate-700 dark:text-slate-100">
                  {bulkIds?.length} ONT
                </strong>{" "}
                yang dipilih.
                <br />
                Data yang sudah dihapus tidak
                bisa dikembalikan.
              </>
            ) : (
              <>
                Kamu akan menghapus ONT dengan
                serial{" "}
                <strong className="text-slate-700 dark:text-slate-100">
                  &quot;{name}&quot;
                </strong>
                .
                <br />
                Data yang sudah dihapus tidak
                bisa dikembalikan.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* =========================================
            ERROR MESSAGE
        ========================================== */}
        {errorMsg && (
          <p
            className="
              mx-4
              rounded-xl
              bg-red-50
              px-3
              py-2
              text-sm
              font-medium
              text-red-600
              dark:bg-red-950/30
              dark:text-red-300
              sm:mx-6
            "
          >
            {errorMsg}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* =========================================
            FOOTER
        ========================================== */}
        <AlertDialogFooter
          className="
            mt-2
            flex-shrink-0
            gap-2
            px-4
            pb-4
            sm:justify-center
            sm:px-6
            sm:pb-6
          "
        >
          <AlertDialogCancel
            disabled={isPending}
            className="
              h-11
              flex-1
              rounded-2xl
              border-slate-200
              bg-white
              text-slate-700
              transition-transform
              hover:bg-slate-50
              active:scale-95
              dark:border-slate-700
              dark:bg-slate-800
              dark:text-slate-200
              dark:hover:bg-slate-700
            "
          >
            Batal
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="
              h-11
              flex-1
              rounded-2xl
              bg-red-600
              font-semibold
              transition-transform
              hover:bg-red-700
              active:scale-95
            "
          >
            {isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            {isPending
              ? "Menghapus..."
              : "Ya, Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};