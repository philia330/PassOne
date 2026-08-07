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
import { MaterialForm } from "@/app/masterdata/material/components/MaterialForm";
import { createMaterial, updateMaterial } from "@/app/masterdata/material/actions";
import type { MaterialData } from "@/types/material";

interface MaterialDialogProps {
  mode: "create" | "edit";
  material?: MaterialData;
  kodeOtomatis?: string;
}

export const MaterialDialog = ({ mode, material, kodeOtomatis }: MaterialDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createMaterial(formData);
        } else if (material) {
          await updateMaterial(material.id_material, formData);
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
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button className="h-11 rounded-2xl font-semibold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Tambah Material
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="cursor-pointer rounded-xl">
  <Pencil className="h-4 w-4 text-slate-500 dark:text-slate-400" />
</Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="
          flex h-full max-h-[100dvh] w-full max-w-full flex-col
          overflow-hidden rounded-none p-0
          sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl sm:p-6
        "
      >
        <DialogHeader className="flex-shrink-0 px-4 pt-4 sm:px-0 sm:pt-0">
          <DialogTitle className="text-lg sm:text-xl">
            {mode === "create" ? "Tambah Material" : "Edit Material"}
          </DialogTitle>
        </DialogHeader>

        <form
          action={handleSubmit}
          className="flex min-h-0 flex-1 flex-col px-4 sm:px-0"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-1 py-4 sm:py-0">
            <MaterialForm defaultValues={material} kodeOtomatis={kodeOtomatis} />

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