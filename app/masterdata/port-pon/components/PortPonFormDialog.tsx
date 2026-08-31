"use client";

import { useState, useEffect, useCallback } from "react";
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

import { createPortPon, updatePortPon } from "../actions";
import { validateNumericInput, validateTextInput } from "@/lib/validations/hooks";

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
  const [tipeKartu, setTipeKartu] = useState("");

  useEffect(() => {
    if (open) {
      if (mode === "edit" && data) {
        setOltValue(data.id_olt ? String(data.id_olt) : "");
        setStatusValue(data.status ?? "TERSEDIA");
        setOdpValue(data.id_odp ? String(data.id_odp) : "");
        setTipeKartu(data.tipe_kartu ?? "");
      } else {
        setOltValue("");
        setStatusValue("TERSEDIA");
        setOdpValue("");
        setTipeKartu("");
      }
    }
  }, [open, mode, data]);

  const handleOltChange = (value: string | null) => {
    setOltValue(value || "");
  };

  const handleOdpChange = (value: string | null) => {
    setOdpValue(value || "");
  };

  // Handle nomor port - numeric only
  const handleNomorPortChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = validateNumericInput(e.target.value, 3);
      e.target.value = sanitized;
    },
    []
  );

  // Handle tipe kartu - text with max length
  const handleTipeKartuChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = validateTextInput(e.target.value, 50);
      setTipeKartu(sanitized);
    },
    []
  );

  const handleSubmit = async (formData: FormData) => {
    // Client-side validation
    if (!oltValue) {
      toast.error("OLT wajib dipilih.");
      return;
    }

    if (!odpValue) {
      toast.error("ODP wajib dipilih.");
      return;
    }

    const nomorPort = formData.get("nomor_port") as string;
    if (!nomorPort || parseInt(nomorPort, 10) < 1 || parseInt(nomorPort, 10) > 256) {
      toast.error("Nomor port harus antara 1 dan 256.");
      return;
    }

    if (!tipeKartu || tipeKartu.trim().length < 1) {
      toast.error("Tipe kartu wajib diisi.");
      return;
    }

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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data Port PON");
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
            Tambah Port PON
          </>
        ) : (
          <Pencil className="h-4 w-4 text-orange-500 hover:text-orange-600 active:scale-90 transition-all dark:text-orange-400 dark:hover:text-orange-300" />
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
          {/* 1 & 2. OLT & ODP berdampingan */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                OLT<span className="text-red-500 ml-1">*</span>
              </label>

              <SearchableSelect
                value={oltValue}
                onValueChange={handleOltChange}
                options={olts.map((olt) => ({
                  value: String(olt.id_olt),
                  label: olt.nama_olt,
                }))}
                placeholder="Pilih OLT"
                searchPlaceholder="Cari nama OLT..."
                emptyText="OLT tidak ditemukan"
              />

              <input type="hidden" name="id_olt" value={oltValue} required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                ODP Terhubung<span className="text-red-500 ml-1">*</span>
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
              Status<span className="text-red-500 ml-1">*</span>
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
                Nomor Port<span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                type="number"
                name="nomor_port"
                defaultValue={data?.nomor_port}
                placeholder="1-256"
                min={1}
                max={256}
                onChange={handleNomorPortChange}
                required
                className="h-12 rounded-2xl border-slate-200 bg-white font-normal placeholder:font-normal placeholder:text-slate-400 focus-visible:ring-purple-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-400">1-256</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Tipe Kartu<span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                name="tipe_kartu"
                value={tipeKartu}
                onChange={handleTipeKartuChange}
                placeholder="GTGO, GTGH"
                maxLength={50}
                required
                autoComplete="off"
                className="h-12 rounded-2xl border-slate-200 bg-white font-normal placeholder:font-normal placeholder:text-slate-400 focus-visible:ring-purple-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-400">{tipeKartu.length}/50 karakter</p>
            </div>
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
              disabled={isSubmitting || !oltValue || !odpValue || !tipeKartu.trim()}
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