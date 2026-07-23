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
import { MaterialForm } from "@/components/forms/MaterialForm";
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

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      if (mode === "create") {
        await createMaterial(formData);
      } else if (material) {
        await updateMaterial(material.id_material, formData);
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
              <Plus className="mr-2 h-4 w-4" /> Tambah Material
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
          <DialogTitle>{mode === "create" ? "Tambah Material" : "Edit Material"}</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit}>
          <MaterialForm defaultValues={material} kodeOtomatis={kodeOtomatis} />

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