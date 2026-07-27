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
import { PaketForm } from "@/app/masterdata/paket/components/PaketForm";
import { createPaket, updatePaket } from "@/app/masterdata/paket/actions";
import type { PaketData } from "@/types/paket";

interface PaketDialogProps {
  mode: "create" | "edit";
  paket?: PaketData;
  kodeOtomatis?: string;
}

export const PaketDialog = ({ mode, paket, kodeOtomatis }: PaketDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      if (mode === "create") {
        await createPaket(formData);
      } else if (paket) {
        await updatePaket(paket.id_paket, formData);
      }
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          mode === "create" ? (
            <Button className="h-11 rounded-2xl font-semibold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white">
              <Plus className="mr-2 h-4 w-4" /> Tambah Paket
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="rounded-xl">
              <Pencil className="h-4 w-4" />
            </Button>
          )
        }
      />

      <DialogContent className="rounded-3xl sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tambah Paket" : "Edit Paket"}</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit}>
          <PaketForm defaultValues={paket} kodeOtomatis={kodeOtomatis} />

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