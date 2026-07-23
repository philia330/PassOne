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

import { createOnt, updateOnt } from "../actions";

type Pop = { id_pop: number; nama_pop: string };
type Odp = { id_odp: number; nama_odp: string };

type OntData = {
  id_ont: number;
  serial_number: string;
  pelanggan: string;
  status: "TERSEDIA" | "TERPASANG" | "RUSAK";
  id_pop: number;
  id_odp: number;
};

export const OntFormDialog = ({
  mode,
  pops,
  odps,
  data,
}: {
  mode: "create" | "edit";
  pops: Pop[];
  odps: Odp[];
  data?: OntData;
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [statusValue, setStatusValue] = useState(data?.status ?? "TERSEDIA");
  const [popValue, setPopValue] = useState(
    data?.id_pop ? String(data.id_pop) : ""
  );
  const [odpValue, setOdpValue] = useState(
    data?.id_odp ? String(data.id_odp) : ""
  );

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        await createOnt(formData);
        toast.success("ONT berhasil ditambahkan");
      } else if (data) {
        await updateOnt(data.id_ont, formData);
        toast.success("ONT berhasil diperbarui");
      }

      setOpen(false);
    } catch {
      toast.error("Terjadi kesalahan, pastikan serial number belum terdaftar");
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
            Tambah ONT
          </>
        ) : (
          <Pencil className="h-4 w-4 text-slate-500" />
        )}
      </DialogTrigger>

      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah ONT" : "Edit ONT"}
          </DialogTitle>

          <DialogDescription>
            Lengkapi data ONT di bawah ini.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Serial Number</label>
            <Input
              name="serial_number"
              defaultValue={data?.serial_number}
              placeholder="Contoh: SN-HW-00123456"
              required
              className="h-12 rounded-2xl border-slate-200 placeholder:text-slate-600 placeholder:font-medium focus-visible:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Pelanggan</label>
            <Input
              name="pelanggan"
              defaultValue={data?.pelanggan}
              placeholder="Contoh: Budi Santoso"
              required
              className="h-12 rounded-2xl border-slate-200 placeholder:text-slate-600 placeholder:font-medium focus-visible:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>

            <Select value={statusValue} onValueChange={(v) => setStatusValue(v as typeof statusValue)}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 focus:ring-purple-500">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="TERSEDIA">Tersedia</SelectItem>
                <SelectItem value="TERPASANG">Terpasang</SelectItem>
                <SelectItem value="RUSAK">Rusak</SelectItem>
              </SelectContent>
            </Select>

            <input type="hidden" name="status" value={statusValue} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">POP</label>

            <Select value={popValue} onValueChange={setPopValue}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 focus:ring-purple-500">
                <SelectValue placeholder="Pilih POP" />
              </SelectTrigger>

              <SelectContent>
                {pops.map((pop) => (
                  <SelectItem key={pop.id_pop} value={String(pop.id_pop)}>
                    {pop.nama_pop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <input type="hidden" name="id_pop" value={popValue} required />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">ODP</label>

            <Select value={odpValue} onValueChange={setOdpValue}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 focus:ring-purple-500">
                <SelectValue placeholder="Pilih ODP" />
              </SelectTrigger>

              <SelectContent>
                {odps.map((odp) => (
                  <SelectItem key={odp.id_odp} value={String(odp.id_odp)}>
                    {odp.nama_odp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <input type="hidden" name="id_odp" value={odpValue} required />
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
              disabled={isSubmitting || !popValue || !odpValue}
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