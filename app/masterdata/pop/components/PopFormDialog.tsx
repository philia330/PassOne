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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createPop, updatePop } from "../actions";

type Area = { id_area: number; nama_area: string };

type PopData = {
  id_pop: number;
  nama_pop: string;
  alamat: string;
  latitude: number | string;
  longitude: number | string;
  id_area: number;
};

export const PopFormDialog = ({
  mode,
  areas,
  data,
}: {
  mode: "create" | "edit";
  areas: Area[];
  data?: PopData;
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [areaValue, setAreaValue] = useState(
    data?.id_area ? String(data.id_area) : ""
  );

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        await createPop(formData);
        toast.success("POP berhasil ditambahkan");
      } else if (data) {
        await updatePop(data.id_pop, formData);
        toast.success("POP berhasil diperbarui");
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
            <Button className="cursor-pointer h-11 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white" />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer rounded-xl"
            />
          )
        }
      >
        {mode === "create" ? (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Tambah POP
          </>
        ) : (
          <Pencil className="h-4 w-4 text-slate-500" />
        )}
      </DialogTrigger>

      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah POP" : "Edit POP"}
          </DialogTitle>

          <DialogDescription>
            Lengkapi data POP di bawah ini.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama POP</label>
            <Input
              name="nama_pop"
              defaultValue={data?.nama_pop}
              placeholder="Contoh: POP Tanggerang Pusat"
              required
              className="h-12 rounded-2xl border-slate-200 placeholder:text-slate-600 placeholder:font-medium focus-visible:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Alamat</label>
            <Input
              name="alamat"
              defaultValue={data?.alamat}
              placeholder="Contoh: Jl. Merdeka No.10, Tanggerang"
              required
              className="h-12 rounded-2xl border-slate-200 placeholder:text-slate-600 placeholder:font-medium focus-visible:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Latitude</label>
            <Input
              name="latitude"
              type="number"
              step="any"
              defaultValue={data?.latitude}
              placeholder="-6.178306"
              required
              className="h-12 rounded-2xl border-slate-200 placeholder:text-slate-600 placeholder:font-medium focus-visible:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Longitude</label>
            <Input
              name="longitude"
              type="number"
              step="any"
              defaultValue={data?.longitude}
              placeholder="106.631889"
              required
              className="h-12 rounded-2xl border-slate-200 placeholder:text-slate-600 placeholder:font-medium focus-visible:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Area</label>

            <Select value={areaValue} onValueChange={setAreaValue}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 focus:ring-purple-500">
                <SelectValue placeholder="Pilih Area" />
              </SelectTrigger>

              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id_area} value={String(area.id_area)}>
                    {area.nama_area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <input type="hidden" name="id_area" value={areaValue} required />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer rounded-2xl"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || !areaValue}
              className="cursor-pointer rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};