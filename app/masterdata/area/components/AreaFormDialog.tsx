"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { createArea, updateArea } from "../actions";

type AreaData = {
  id_area: number;
  nama_area: string;
  keterangan: string | null;
};

export const AreaFormDialog = ({
  mode,
  data,
}: {
  mode: "create" | "edit";
  data?: AreaData;
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        await createArea(formData);
        toast.success("Area berhasil ditambahkan");
      } else if (data) {
        await updateArea(data.id_area, formData);
        toast.success("Area berhasil diperbarui");
      }

      setOpen(false);
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          mode === "create" ? (
            <Button className="cursor-pointer h-11 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white active:scale-95 transition-transform" />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer rounded-xl active:scale-90 transition-transform"
            />
          )
        }
      >
        {mode === "create" ? (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Area
          </>
        ) : (
          <Pencil className="h-4 w-4 text-orange-500 hover:text-orange-600 active:scale-90 transition-all dark:text-orange-400 dark:hover:text-orange-300" />
        )}
      </DialogTrigger>

      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah Area" : "Edit Area"}
          </DialogTitle>

          <DialogDescription>
            Lengkapi data Area di bawah ini.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium dark:text-slate-300">Nama Area</label>
            <Input
              name="nama_area"
              defaultValue={data?.nama_area}
              placeholder="Contoh: Tanggerang Selatan"
              required
              className="h-12 rounded-2xl border-slate-200 placeholder:text-slate-600 placeholder:font-medium focus-visible:ring-purple-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium dark:text-slate-300">
              Keterangan{" "}
              <span className="font-normal text-slate-400 dark:text-slate-500">(opsional)</span>
            </label>
            <Input
              name="keterangan"
              defaultValue={data?.keterangan ?? ""}
              placeholder="Contoh: Mencakup wilayah Ciputat dan sekitarnya"
              className="h-12 rounded-2xl border-slate-200 placeholder:text-slate-600 placeholder:font-medium focus-visible:ring-purple-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer rounded-2xl active:scale-95 transition-transform"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white active:scale-95 transition-transform"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};