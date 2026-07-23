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
import { FabForm } from "@/components/forms/FabForm";
import { createFab, updateFab } from "@/app/jaringan/fab/actions";
import type { FabData, AreaOption, PaketOption, UserOption } from "@/types/fab";

interface FabDialogProps {
  mode: "create" | "edit";
  fab?: FabData;
  kodeOtomatis?: string;
  areaOptions: AreaOption[];
  paketOptions: PaketOption[];
  salesOptions: UserOption[];
}

export const FabDialog = ({
  mode,
  fab,
  kodeOtomatis,
  areaOptions,
  paketOptions,
  salesOptions,
}: FabDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      } catch (err: any) {
        setErrorMsg(err.message ?? "Terjadi kesalahan, coba lagi.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button className="h-11 rounded-2xl font-semibold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white">
            <Plus className="mr-2 h-4 w-4" /> Tambah FAB
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="rounded-xl">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="rounded-3xl sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tambah FAB" : "Edit FAB"}</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit}>
          <FabForm
            defaultValues={fab}
            kodeOtomatis={kodeOtomatis}
            areaOptions={areaOptions}
            paketOptions={paketOptions}
            salesOptions={salesOptions}
          />

          {errorMsg && (
            <p className="mt-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl px-3 py-2">
              {errorMsg}
            </p>
          )}

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl h-11"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 rounded-2xl font-semibold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white"
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