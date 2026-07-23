"use client";

import dynamic from "next/dynamic";
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

import { createOdp, updateOdp } from "../actions";

const OdpMapPicker = dynamic(
  () => import("./OdpMapPicker").then((mod) => mod.OdpMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[220px] items-center justify-center rounded-2xl border bg-white text-slate-400">
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
};

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

  const handlePick = (pickedLat: number, pickedLng: number) => {
    setLat(pickedLat);
    setLng(pickedLng);
  };

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
            <Button className="cursor-pointer h-11 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white" />
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
          <Pencil className="h-4 w-4 text-slate-500" />
        )}
      </DialogTrigger>

      <DialogContent className="rounded-3xl sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah ODP" : "Edit ODP"}
          </DialogTitle>

          <DialogDescription>
            Lengkapi data ODP di bawah ini.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">

          <div className="space-y-2">
            <label className="text-sm font-medium">Nama ODP</label>
            <Input
              name="nama_odp"
              defaultValue={data?.nama_odp}
              placeholder="Contoh: ODP Tanggerang Blok A"
              required
              className="h-12 rounded-2xl border-slate-200 placeholder:text-slate-600 placeholder:font-medium focus-visible:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Alamat</label>
            <Input
              name="alamat"
              defaultValue={data?.alamat}
              placeholder="Contoh: Jl. Sukup No.15, Tanggerang"
              required
              className="h-12 rounded-2xl border-slate-200 placeholder:text-slate-600 placeholder:font-medium focus-visible:ring-purple-500"
            />
          </div>

          {/* Peta pilih lokasi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Lokasi di Peta</label>
            <OdpMapPicker lat={lat} lng={lng} onPick={handlePick} />
          </div>

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
              className="h-12 rounded-2xl border-slate-200 placeholder:text-slate-600 placeholder:font-medium focus-visible:ring-purple-500"
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
              className="h-12 rounded-2xl border-slate-200 placeholder:text-slate-600 placeholder:font-medium focus-visible:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">OLT</label>

            <Select value={oltValue} onValueChange={setOltValue}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 focus:ring-purple-500">
                <SelectValue placeholder="Contoh: OLT Huawei Tanggerang 1" />
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
              disabled={isSubmitting || !oltValue}
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