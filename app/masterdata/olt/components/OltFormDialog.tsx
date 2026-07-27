"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "./PasswordInput";
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
import { createOlt, updateOlt } from "../actions";

const OltMapPicker = dynamic(
  () => import("./OltMapPicker").then((mod) => mod.OltMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[220px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
        Memuat peta...
      </div>
    ),
  }
);

type Pop = {
  id_pop: number;
  nama_pop: string;
  alamat: string;
};

type OltData = {
  id_olt: number;
  nama_olt: string;
  lokasi: string;
  latitude: number | string;
  longitude: number | string;
  id_pop: number;
  ip_olt?: string | null;
  username_olt?: string | null;
  password_olt?: string | null;
};

export const OltFormDialog = ({
  mode,
  pops,
  data,
}: {
  mode: "create" | "edit";
  pops: Pop[];
  data?: OltData;
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popValue, setPopValue] = useState(
    data?.id_pop ? String(data.id_pop) : ""
  );

  const [lat, setLat] = useState<number>(
    data?.latitude ? Number(data.latitude) : 0
  );
  const [lng, setLng] = useState<number>(
    data?.longitude ? Number(data.longitude) : 0
  );

  const [lokasi, setLokasi] = useState<string>(data?.lokasi ?? "");

  useEffect(() => {
    const selectedPop = pops.find((p) => String(p.id_pop) === popValue);
    if (selectedPop) {
      setLokasi(selectedPop.alamat);
    }
  }, [popValue, pops]);

  const handlePick = (pickedLat: number, pickedLng: number) => {
    setLat(pickedLat);
    setLng(pickedLng);
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createOlt(formData);
        toast.success("OLT berhasil ditambahkan");
      } else if (data) {
        await updateOlt(data.id_olt, formData);
        toast.success("OLT berhasil diperbarui");
      }
      setOpen(false);
    } catch {
      toast.error("Terjadi kesalahan, silakan coba lagi");
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
            Tambah OLT
          </>
        ) : (
          <Pencil className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] rounded-3xl overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah OLT" : "Edit OLT"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi data perangkat OLT di bawah ini.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          {/* POP - paling atas */}
          <div className="space-y-2">
            <label className="text-sm font-medium">POP</label>
            <Select value={popValue} onValueChange={setPopValue}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                <SelectValue placeholder="Pilih POP">
                  {() =>
                    pops.find((p) => String(p.id_pop) === popValue)?.nama_pop ??
                    "Pilih POP"
                  }
                </SelectValue>
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
            <label className="text-sm font-medium">Nama OLT</label>
            <Input
              name="nama_olt"
              defaultValue={data?.nama_olt}
              placeholder="Contoh: OLT Huawei Tanggerang 1"
              required
              className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Lokasi</label>
            <Input
              name="lokasi"
              value={lokasi}
              readOnly
              placeholder="Pilih POP terlebih dahulu"
              required
<<<<<<< HEAD
              className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
=======
              className="h-12 rounded-2xl border-slate-200 bg-slate-100 text-slate-600 focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400 dark:placeholder:text-slate-500"
>>>>>>> origin/feature/master-data
            />
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Lokasi otomatis mengikuti alamat POP yang dipilih.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Lokasi di Peta</label>
            <OltMapPicker lat={lat} lng={lng} onPick={handlePick} />
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

          <div className="space-y-2">
<<<<<<< HEAD
            <label className="text-sm font-medium">POP</label>
            <Select value={popValue} onValueChange={setPopValue}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
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

=======
            <label className="text-sm font-medium">
              IP Address{" "}
              <span className="font-normal text-slate-400 dark:text-slate-500">(opsional)</span>
            </label>
            <Input
              name="ip_olt"
              defaultValue={data?.ip_olt ?? ""}
              placeholder="Contoh: 192.168.1.1"
              className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Username{" "}
                <span className="font-normal text-slate-400 dark:text-slate-500">(opsional)</span>
              </label>
              <Input
                name="username_olt"
                defaultValue={data?.username_olt ?? ""}
                placeholder="admin"
                className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Password{" "}
                <span className="font-normal text-slate-400 dark:text-slate-500">(opsional)</span>
              </label>
              <PasswordInput
                name="password_olt"
                defaultValue={data?.password_olt ?? ""}
                placeholder="••••••••"
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

>>>>>>> origin/feature/master-data
            <Button
              type="submit"
              disabled={isSubmitting}
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