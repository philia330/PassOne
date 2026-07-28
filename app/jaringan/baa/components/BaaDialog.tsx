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
import { BaaForm } from "@/app/jaringan/baa/components/BaaForm";
import { createBaa, updateBaa } from "@/app/jaringan/baa/actions";
import { useRouter } from "next/navigation";
import type {
  BaaData,
  FabOption,
  TeknisiOption,
  OltOption,
  OdpOption,
  OntOption,
  MaterialOption,
} from "@/types/baa";

interface BaaDialogProps {
  mode: "create" | "edit";
  baa?: BaaData;
  kodeOtomatis?: string;
  fabOptions: FabOption[];
  teknisiOptions: TeknisiOption[];
  oltOptions: OltOption[];
  odpOptions: OdpOption[];
  ontOptions: OntOption[];
  materialOptions: MaterialOption[];
  onTeknisiAdded?: () => void;
}

export const BaaDialog = ({
  mode,
  baa,
  kodeOtomatis,
  fabOptions,
  teknisiOptions,
  oltOptions,
  odpOptions,
  ontOptions,
  materialOptions,
  onTeknisiAdded,
}: BaaDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = (formData: FormData) => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createBaa(formData);
        } else if (baa) {
          await updateBaa(baa.id_baa, formData);
        }
        setOpen(false);
        router.refresh(); // Refresh data di halaman
        // Tidak perlu redirect, karena BAA pakai dialog
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(error.message ?? "Terjadi kesalahan, coba lagi.");
      }
    });
  };

  const handleTeknisiAdded = () => {
    if (onTeknisiAdded) {
      onTeknisiAdded();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button className="h-11 rounded-2xl font-semibold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Tambah BAA
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="rounded-xl w-full sm:w-auto">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="
          flex h-full max-h-[100dvh] w-full max-w-full flex-col
          overflow-hidden rounded-none p-0
          sm:h-auto sm:max-h-[90vh] sm:max-w-[720px] sm:rounded-3xl sm:p-6
        "
      >
        <DialogHeader className="flex-shrink-0 px-4 pt-4 sm:px-0 sm:pt-0">
          <DialogTitle className="text-lg sm:text-xl">
            {mode === "create" ? "Tambah BAA" : "Edit BAA"}
          </DialogTitle>
        </DialogHeader>

        <form
          action={handleSubmit}
          className="flex min-h-0 flex-1 flex-col px-4 sm:px-0"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-1 py-4 sm:py-0">
            <BaaForm
              defaultValues={baa}
              kodeOtomatis={kodeOtomatis}
              fabOptions={fabOptions}
              teknisiOptions={teknisiOptions}
              oltOptions={oltOptions}
              odpOptions={odpOptions}
              ontOptions={ontOptions}
              materialOptions={materialOptions}
              onTeknisiAdded={handleTeknisiAdded}
            />

            {errorMsg && (
              <p className="mt-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl px-3 py-2">
                {errorMsg}
              </p>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 border-t border-slate-100 pt-4 pb-4 sm:pb-0 sm:border-t-0 sm:pt-6">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl h-11 flex-1 sm:flex-none"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 rounded-2xl font-semibold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white flex-1 sm:flex-none"
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