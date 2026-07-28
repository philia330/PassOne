"use client";

import { useState, useEffect } from "react";
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

import { createPortPon, updatePortPon } from "../actions";

type Olt = { id_olt: number; nama_olt: string };
type Odp = { id_odp: number; nama_odp: string };

type PortPonData = {
  id_port_pon: number;
  id_olt: number;
  nomor_port: number;
  tipe_kartu: string;
  status: "TERSEDIA" | "TERPASANG" | "RUSAK";
  id_odp?: number | null;
};

const statusLabel: Record<string, string> = {
  TERSEDIA: "Tersedia",
  TERPASANG: "Terpasang",
  RUSAK: "Rusak",
};

export const PortPonFormDialog = ({
  mode,
  olts,
  odps,
  data,
}: {
  mode: "create" | "edit";
  olts: Olt[];
  odps: Odp[];
  data?: PortPonData;
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [oltValue, setOltValue] = useState("");
  const [statusValue, setStatusValue] = useState<"TERSEDIA" | "TERPASANG" | "RUSAK">("TERSEDIA");
  const [odpValue, setOdpValue] = useState("");

  useEffect(() => {
    if (open) {
      if (mode === "edit" && data) {
        setOltValue(data.id_olt ? String(data.id_olt) : "");
        setStatusValue(data.status ?? "TERSEDIA");
        setOdpValue(data.id_odp ? String(data.id_odp) : "");
      } else {
        setOltValue("");
        setStatusValue("TERSEDIA");
        setOdpValue("");
      }
    }
  }, [open, mode, data]);

  const selectedOltName = olts.find((olt) => String(olt.id_olt) === oltValue)?.nama_olt;
  const selectedOdpName = odps.find((odp) => String(odp.id_odp) === odpValue)?.nama_odp;

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        await createPortPon(formData);
        toast.success("Port PON berhasil ditambahkan");
      } else if (data) {
        await updatePortPon(data.id_port_pon, formData);
        toast.success("Port PON berhasil diperbarui");
      }

      setOpen(false);
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan data Port PON");
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
            Tambah Port PON
          </>
        ) : (
          <Pencil className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        )}
      </DialogTrigger>

      <DialogContent className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">
            {mode === "create" ? "Tambah Port PON" : "Edit Port PON"}
          </DialogTitle>

          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Lengkapi data Port PON di bawah ini.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          {/* 1. OLT */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              OLT
            </label>

            <Select value={oltValue} onValueChange={setOltValue}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100">
                <SelectValue placeholder="Pilih OLT">
                  {(value: string) =>
                    olts.find((olt) => String(olt.id_olt) === value)?.nama_olt ??
                    "Pilih OLT"
                  }
                </SelectValue>
              </SelectTrigger>

              <SelectContent className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {olts.map((olt) => (
                  <SelectItem
                    key={olt.id_olt}
                    value={String(olt.id_olt)}
                    className="dark:text-slate-200 dark:focus:bg-slate-800 dark:focus:text-slate-100"
                  >
                    {olt.nama_olt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <input type="hidden" name="id_olt" value={oltValue} required />
          </div>

          {/* 2. ODP Terhubung (Opsional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              ODP Terhubung{" "}
              <span className="font-normal text-slate-400 dark:text-slate-500">
                (opsional)
              </span>
            </label>

            <Select value={odpValue} onValueChange={setOdpValue}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100">
                <SelectValue placeholder="Pilih ODP (opsional)">
                  {(value: string) =>
                    odps.find((odp) => String(odp.id_odp) === value)?.nama_odp ??
                    "Pilih ODP (opsional)"
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

            <input type="hidden" name="id_odp" value={odpValue} />
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

          {/* 4. Nomor Port & Tipe Kartu */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nomor Port
              </label>
              <Input
                type="number"
                name="nomor_port"
                defaultValue={data?.nomor_port}
                placeholder="Contoh: 1"
                required
                className="h-12 rounded-2xl border-slate-200 bg-white font-normal placeholder:font-normal placeholder:text-slate-400 focus-visible:ring-purple-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Tipe Kartu
              </label>
              <Input
                name="tipe_kartu"
                defaultValue={data?.tipe_kartu}
                placeholder="Contoh: GTGO, GTGH"
                required
                className="h-12 rounded-2xl border-slate-200 bg-white font-normal placeholder:font-normal placeholder:text-slate-400 focus-visible:ring-purple-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
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
              disabled={isSubmitting || !oltValue}
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