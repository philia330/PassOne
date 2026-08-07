"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Pencil, Plus, Loader2, Navigation } from "lucide-react";
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
  foto_olt?: string | null;
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

  const handlePopChange = (value: string | null) => {
    setPopValue(value || "");
  };

  const [lat, setLat] = useState<number>(
    data?.latitude ? Number(data.latitude) : 0
  );
  const [lng, setLng] = useState<number>(
    data?.longitude ? Number(data.longitude) : 0
  );

  const [lokasi, setLokasi] = useState<string>(data?.lokasi ?? "");

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation tidak didukung browser ini.");
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLat(parseFloat(latitude.toFixed(6)));
        setLng(parseFloat(longitude.toFixed(6)));
        setGpsLoading(false);
      },
      (error) => {
        setGpsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError("Izin lokasi ditolak. Aktifkan di pengaturan browser.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError("Lokasi tidak tersedia.");
            break;
          case error.TIMEOUT:
            setGpsError("Waktu habis mencari lokasi.");
            break;
          default:
            setGpsError("Gagal mendapatkan lokasi.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

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
            <Select value={popValue} onValueChange={handlePopChange}>
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
              className="h-12 rounded-2xl border-slate-200 bg-slate-100 text-slate-600 focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400 dark:placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Lokasi otomatis mengikuti alamat POP yang dipilih.
            </p>
          </div>

          {/* IP Address */}
          <div className="space-y-2">
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

          {/* Username & Password */}
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

          {/* Foto OLT */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Foto OLT{" "}
              <span className="font-normal text-slate-400 dark:text-slate-500">(opsional)</span>
            </label>
            {data?.foto_olt && (
              <img
                src={data.foto_olt}
                alt="Foto OLT saat ini"
                className="mb-2 h-32 w-full rounded-2xl border border-slate-200 object-cover dark:border-slate-700"
              />
            )}
            <Input
              name="foto_olt"
              type="file"
              accept="image/*"
              className="h-12 rounded-2xl border-slate-200 bg-white file:mr-3 file:h-full file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:text-sm file:font-medium focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:file:bg-slate-700 dark:file:text-slate-200"
            />
            {data?.foto_olt && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Kosongkan kalau tidak ingin mengganti foto.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Lokasi di Peta</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                disabled={gpsLoading}
                className="rounded-xl h-8 text-xs border-cyan-200 text-cyan-700 hover:bg-cyan-50 gap-1.5 dark:border-cyan-800 dark:text-cyan-400 dark:hover:bg-cyan-500/10"
              >
                {gpsLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Navigation className="h-3.5 w-3.5" />
                )}
                {gpsLoading ? "Mencari..." : "GPS Saya"}
              </Button>
            </div>
            {gpsError && (
              <p className="text-xs text-red-500 dark:text-red-400">{gpsError}</p>
            )}
            {lat !== 0 && lng !== 0 && !gpsError && (
              <p className="text-xs text-emerald-500 dark:text-emerald-400">
                Lokasi tersimpan: {lat}, {lng}
              </p>
            )}
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