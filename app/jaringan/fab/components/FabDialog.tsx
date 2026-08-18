"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FabForm } from "@/app/jaringan/fab/components/FabForm";
import { createFab, updateFab } from "@/app/jaringan/fab/actions";
import type { FabData, AreaOption, PaketOption, UserOption, CurrentUser} from "@/types/fab";

interface FabDialogProps {
  mode: "create" | "edit";
  fab?: FabData;
  kodeOtomatis?: string;
  areaOptions: AreaOption[];
  paketOptions: PaketOption[];
  salesOptions: UserOption[];
  currentUser: CurrentUser;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const FabDialog = ({
  mode,
  fab,
  kodeOtomatis,
  areaOptions,
  paketOptions,
  salesOptions,
  currentUser,
  open: openProp,
  onOpenChange,
}: FabDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Controlled vs uncontrolled
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const handleSubmit = (formData: FormData) => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createFab(formData);
        } else if (fab) {
          await updateFab(fab.id_fab, formData);
        }
        setOpen(false);
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(error.message ?? "Terjadi kesalahan, coba lagi.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger CUMA muncul kalau dipakai standalone (uncontrolled). Kalau
          dipakai controlled -- misal dari FabActionsDropdown yang sudah punya
          tombol titik tiga sendiri -- trigger ini disembunyikan supaya tidak
          dobel dengan menu "Edit FAB" / "Tambah FAB" yang manapun manggilnya. */}
      {!isControlled && (
        <DialogTrigger asChild>
          {mode === "create" ? (
            <Button className="h-12 rounded-2xl font-semibold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white w-full sm:w-auto active:scale-95 hover:scale-105 transition-transform shadow-md hover:shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Tambah FAB
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="rounded-xl w-full sm:w-auto active:scale-95 hover:scale-105 transition-transform">
              <Pencil className="h-4 w-4 text-orange-500" />
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent
        className="
          flex h-full max-h-[100dvh] w-full max-w-full flex-col
          overflow-hidden rounded-none p-0
          sm:h-auto sm:max-h-[90vh] sm:max-w-[640px] sm:rounded-3xl sm:p-6
        "
      >
        <DialogHeader className="flex-shrink-0 px-4 pt-4 sm:px-0 sm:pt-0">
          <DialogTitle className="text-lg sm:text-xl">
            {mode === "create" ? "Tambah FAB" : "Edit FAB"}
          </DialogTitle>
        </DialogHeader>

        <form
          action={handleSubmit}
          className="flex min-h-0 flex-1 flex-col px-4 sm:px-0"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-1 py-4 sm:py-0">
            <FabForm
              defaultValues={fab}
              kodeOtomatis={kodeOtomatis}
              areaOptions={areaOptions}
              paketOptions={paketOptions}
              salesOptions={salesOptions}
              currentUser={currentUser}
            />

            {errorMsg && (
              <p className="mt-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl px-3 py-2">
                {errorMsg}
              </p>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 border-t border-slate-100 pt-4 pb-4 sm:pb-0 sm:border-t-0 sm:pt-6 gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl h-11 flex-1 sm:flex-none active:scale-95 hover:scale-105 transition-transform dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 rounded-2xl font-semibold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white flex-1 sm:flex-none active:scale-95 hover:scale-105 transition-transform shadow-md hover:shadow-lg"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};