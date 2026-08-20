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

import { SearchableSelect } from "@/components/ui/searchable-select";
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
  id_pop: number | null;
  id_odp: number | null;
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

  const initialStatus = data?.status === "TERPASANG" ? "TERSEDIA" : (data?.status ?? "TERSEDIA");
  const [statusValue, setStatusValue] = useState<"TERSEDIA" | "RUSAK">(initialStatus);
  const [popValue, setPopValue] = useState(
    data?.id_pop ? String(data.id_pop) : ""
  );
  const [odpValue, setOdpValue] = useState(
    data?.id_odp ? String(data.id_odp) : ""
  );

  const handlePopChange = (value: string | null) => {
    setPopValue(value || "");
  };

  const handleOdpChange = (value: string | null) => {
    setOdpValue(value || "");
  };

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
            <Button className="h-12 cursor-pointer rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-md hover:opacity-90 active:scale-95 hover:scale-105 transition-transform font-semibold" />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer rounded-xl active:scale-90 transition-transform dark:hover:bg-slate-800 dark:hover:text-slate-100"
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
          <Pencil className="h-4 w-4 text-orange-500 hover:text-orange-600 active:scale-90 transition-all dark:text-orange-400 dark:hover:text-orange-300" />
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
          {/* 1 & 2. POP & ODP berdampingan */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                POP
              </label>

              <SearchableSelect
                value={popValue}
                onValueChange={handlePopChange}
                options={pops.map((pop) => ({
                  value: String(pop.id_pop),
                  label: pop.nama_pop,
                }))}
                placeholder="Pilih POP"
                searchPlaceholder="Cari nama POP..."
                emptyText="POP tidak ditemukan"
              />

              <input type="hidden" name="id_pop" value={popValue} required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                ODP
              </label>

              <SearchableSelect
                value={odpValue}
                onValueChange={handleOdpChange}
                options={odps.map((odp) => ({
                  value: String(odp.id_odp),
                  label: odp.nama_odp,
                }))}
                placeholder="Pilih ODP"
                searchPlaceholder="Cari nama ODP..."
                emptyText="ODP tidak ditemukan"
              />

              <input type="hidden" name="id_odp" value={odpValue} required />
            </div>
          </div>

          {/* 3. Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Status
            </label>

            {mode === "create" ? (
              /* Mode Create: Status forced ke TERSEDIA, tidak bisa diubah */
              <div className="flex items-center gap-3">
                <input type="hidden" name="status" value="TERSEDIA" />
                <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                    Tersedia
                  </span>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Status otomatis diatur saat ONT ditambahkan
                </span>
              </div>
            ) : (
              /* Mode Edit: Hanya bisa ubah ke RUSAK (bila TERPASANG) atau RUSAK -> TERSEDIA */
              <Select
                value={statusValue}
                onValueChange={(v) => setStatusValue(v as typeof statusValue)}
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white focus:ring-purple-500 hover:scale-105 active:scale-95 transition-all dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100">
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
                    value="RUSAK"
                    className="dark:text-slate-200 dark:focus:bg-slate-800 dark:focus:text-slate-100"
                  >
                    Rusak
                  </SelectItem>
                </SelectContent>
              </Select>
            )}

            {mode === "edit" && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Catatan: status <span className="font-semibold text-emerald-600 dark:text-emerald-400">Terpasang</span> diatur otomatis saat ONT dipakai di BAA. Di form ini, Anda hanya bisa mengubah ke <span className="font-semibold text-amber-600 dark:text-amber-400">Tersedia</span> atau <span className="font-semibold text-rose-600 dark:text-rose-400">Rusak</span>.
              </p>
            )}

            <input type="hidden" name="status" value={mode === "create" ? "TERSEDIA" : statusValue} />
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
          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer rounded-2xl h-11 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 active:scale-95 hover:scale-105 transition-transform"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || !popValue || !odpValue}
              className="cursor-pointer rounded-2xl h-11 font-semibold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-md hover:opacity-90 active:scale-95 hover:scale-105 transition-transform"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};