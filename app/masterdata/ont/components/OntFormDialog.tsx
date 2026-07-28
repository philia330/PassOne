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

const statusLabel: Record<string, string> = {
  TERSEDIA: "Tersedia",
  TERPASANG: "Terpasang",
  RUSAK: "Rusak",
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

  const [serialNumber, setSerialNumber] = useState(data?.serial_number ?? "");
  const [pelanggan, setPelanggan] = useState(data?.pelanggan ?? "");

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
            <Button className="h-11 cursor-pointer rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-md hover:opacity-90" />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer rounded-xl dark:hover:bg-slate-800 dark:hover:text-slate-100"
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
          <Pencil className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        )}
      </DialogTrigger>

      <DialogContent className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">
            {mode === "create" ? "Tambah ONT" : "Edit ONT"}
          </DialogTitle>

          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Lengkapi data ONT di bawah ini.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          {/* 1. POP */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              POP
            </label>

            <Select value={popValue} onValueChange={setPopValue}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100">
                <SelectValue placeholder="Pilih POP">
                  {(value: string) =>
                    pops.find((pop) => String(pop.id_pop) === value)?.nama_pop ??
                    "Pilih POP"
                  }
                </SelectValue>
              </SelectTrigger>

              <SelectContent className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {pops.map((pop) => (
                  <SelectItem
                    key={pop.id_pop}
                    value={String(pop.id_pop)}
                    className="dark:text-slate-200 dark:focus:bg-slate-800 dark:focus:text-slate-100"
                  >
                    {pop.nama_pop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <input type="hidden" name="id_pop" value={popValue} required />
          </div>

          {/* 2. ODP */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              ODP
            </label>

            <Select value={odpValue} onValueChange={setOdpValue}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100">
                <SelectValue placeholder="Pilih ODP">
                  {(value: string) =>
                    odps.find((odp) => String(odp.id_odp) === value)?.nama_odp ??
                    "Pilih ODP"
                  }
                </SelectValue>
              </SelectTrigger>

              <SelectContent className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {odps.map((odp) => (
                  <SelectItem
                    key={odp.id_odp}
                    value={String(odp.id_odp)}
                    className="dark:text-slate-200 dark:focus:bg-slate-800 dark:focus:text-slate-100"
                  >
                    {odp.nama_odp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <input type="hidden" name="id_odp" value={odpValue} required />
          </div>

          {/* 3. Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Status
            </label>

            <Select
              value={statusValue}
              onValueChange={(v) => setStatusValue(v as typeof statusValue)}
            >
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100">
                <SelectValue placeholder="Pilih status">
                  {(value: string) => statusLabel[value] ?? "Pilih status"}
                </SelectValue>
              </SelectTrigger>

              <SelectContent className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <SelectItem
                  value="TERSEDIA"
                  className="dark:text-slate-200 dark:focus:bg-slate-800 dark:focus:text-slate-100"
                >
                  Tersedia
                </SelectItem>
                <SelectItem
                  value="TERPASANG"
                  className="dark:text-slate-200 dark:focus:bg-slate-800 dark:focus:text-slate-100"
                >
                  Terpasang
                </SelectItem>
                <SelectItem
                  value="RUSAK"
                  className="dark:text-slate-200 dark:focus:bg-slate-800 dark:focus:text-slate-100"
                >
                  Rusak
                </SelectItem>
              </SelectContent>
            </Select>

            <input type="hidden" name="status" value={statusValue} />
          </div>

          {/* 4. Serial Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Serial Number
            </label>
            <Input
              name="serial_number"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="Contoh: SN-HW-00123456"
              required
              className="h-12 rounded-2xl border-slate-200 bg-white font-normal placeholder:font-normal placeholder:text-slate-400 focus-visible:ring-purple-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          {/* 5. Nama Pelanggan */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nama Pelanggan
            </label>
            <Input
              name="pelanggan"
              value={pelanggan}
              onChange={(e) => setPelanggan(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              required
              className="h-12 rounded-2xl border-slate-200 bg-white font-normal placeholder:font-normal placeholder:text-slate-400 focus-visible:ring-purple-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Footer Actions */}
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || !popValue || !odpValue}
              className="cursor-pointer rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-md hover:opacity-90"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};