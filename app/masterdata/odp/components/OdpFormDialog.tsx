"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Pencil, Plus, TriangleAlert } from "lucide-react";
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

import { createOdp, updateOdp } from "../actions";

const OdpMapPicker = dynamic(
  () => import("./OdpMapPicker").then((mod) => mod.OdpMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[220px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
        Memuat peta...
      </div>
    ),
  }
);

type Olt = {
  id_olt: number;
  nama_olt: string;
};

type OdpData = {
  id_odp: number;
  nama_odp: string;
  alamat: string;
  latitude: number | string;
  longitude: number | string;
  id_olt: number;
  jumlah_port?: number | null;
  stok_port?: number | null;
};

const WARNING_THRESHOLD = 0.8;

export const OdpFormDialog = ({
  mode,
  olts,
  data,
}: {
  mode: "create" | "edit";
  olts: Olt[];
  data?: OdpData;
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [oltValue, setOltValue] = useState(
    data?.id_olt ? String(data.id_olt) : ""
  );

  const [lat, setLat] = useState<number>(
    data?.latitude ? Number(data.latitude) : 0
  );
  const [lng, setLng] = useState<number>(
    data?.longitude ? Number(data.longitude) : 0
  );

  const [jumlahPort, setJumlahPort] = useState<string>(
    data?.jumlah_port != null ? String(data.jumlah_port) : ""
  );
  const [stokPort, setStokPort] = useState<string>(
    data?.stok_port != null ? String(data.stok_port) : ""
  );

  const handlePick = (pickedLat: number, pickedLng: number) => {
    setLat(pickedLat);
    setLng(pickedLng);
  };

  const jumlahNum = parseInt(jumlahPort, 10);
  const stokNum = parseInt(stokPort, 10) || 0;
  const isPenuh = jumlahNum > 0 && stokNum >= jumlahNum;
  const isHampirPenuh =
    jumlahNum > 0 && !isPenuh && stokNum / jumlahNum >= WARNING_THRESHOLD;

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        await createOdp(formData);
        toast.success("ODP berhasil ditambahkan");
      } else if (data) {
        await updateOdp(data.id_odp, formData);
        toast.success("ODP berhasil diperbarui");
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
            <Button className="cursor-pointer h-11 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 font-semibold text-white" />
          ) : (
            <Button variant="ghost" size="icon" className="cursor-pointer rounded-xl" />
          )
        }
      >
        {mode === "create" ? (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Tambah ODP
          </>
        ) : (
          <Pencil className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] rounded-3xl overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah ODP" : "Edit ODP"}
          </DialogTitle>

          <DialogDescription>
            Lengkapi data ODP di bawah ini.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          {/* OLT dipindah ke paling atas */}
          <div className="space-y-2">
            <label className="text-sm font-medium">OLT</label>

            <Select value={oltValue} onValueChange={setOltValue}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                <SelectValue placeholder="Pilih OLT">
                  {(value: string) =>
                    olts.find((olt) => String(olt.id_olt) === value)?.nama_olt ?? "Pilih OLT"
                  }
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                {olts.map((olt) => (
                  <SelectItem
                    key={olt.id_olt}
                    value={String(olt.id_olt)}
                  >
                    {olt.nama_olt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <input type="hidden" name="id_olt" value={oltValue} required />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nama ODP</label>
            <Input
              name="nama_odp"
              defaultValue={data?.nama_odp}
              placeholder="Contoh: ODP Tanggerang Blok A"
              required
              className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Alamat</label>
            <Input
              name="alamat"
              defaultValue={data?.alamat}
              placeholder="Contoh: Jl. Sukup No.15, Tanggerang"
              required
              className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Jumlah Port & Stok Port - setelah Alamat, sebelum Peta */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Jumlah Port{" "}
                <span className="font-normal text-slate-400 dark:text-slate-500">(opsional)</span>
              </label>
              <Input
                name="jumlah_port"
                type="number"
                min={0}
                value={jumlahPort}
                onChange={(e) => setJumlahPort(e.target.value)}
                placeholder="Contoh: 16"
                className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Stok Port Terpakai{" "}
                <span className="font-normal text-slate-400 dark:text-slate-500">(opsional)</span>
              </label>
              <Input
                name="stok_port"
                type="number"
                min={0}
                value={stokPort}
                onChange={(e) => setStokPort(e.target.value)}
                placeholder="Contoh: 12"
                className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {(isPenuh || isHampirPenuh) && (
            <div
              className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
                isPenuh
                  ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400"
                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400"
              }`}
            >
              <TriangleAlert className="h-4 w-4 shrink-0" />
              <span>
                {isPenuh
                  ? "Stok port sudah penuh."
                  : "Stok port hampir penuh, sisa port terbatas."}
              </span>
            </div>
          )}

          {/* Peta pilih lokasi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Lokasi di Peta</label>
            <OdpMapPicker lat={lat} lng={lng} onPick={handlePick} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Latitude</label>
              <Input
                name="latitude"
                type="number"
                step="any"
                value={lat === 0 ? "" : lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                placeholder="-6.178306"
                required
                className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Longitude</label>
              <Input
                name="longitude"
                type="number"
                step="any"
                value={lng === 0 ? "" : lng}
                onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                placeholder="106.631889"
                required
                className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              className="h-11 cursor-pointer rounded-2xl"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || !oltValue}
              className="h-11 cursor-pointer rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 font-semibold text-white"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};