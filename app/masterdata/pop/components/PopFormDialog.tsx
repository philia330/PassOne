"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { Pencil, Plus, Loader2, Navigation } from "lucide-react";
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
import { validateTextInput } from "@/lib/validations/hooks";

const PopMapPicker = dynamic(
  () => import("./PopMapPicker").then((mod) => mod.PopMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[220px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
        Memuat peta...
      </div>
    ),
  }
);

type Area = { id_area: number; nama_area: string };

type PopData = {
  id_pop: number;
  nama_pop: string;
  alamat: string;
  id_area: number;
  latitude?: number | string;
  longitude?: number | string;
};

// Batas jumlah karakter untuk masing-masing input teks
const NAMA_POP_MAX_LENGTH = 100;
const ALAMAT_MAX_LENGTH = 255;

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

  const [namaPop, setNamaPop] = useState(data?.nama_pop ?? "");
  const [alamat, setAlamat] = useState(data?.alamat ?? "");

  const [lat, setLat] = useState<number>(
    data?.latitude ? Number(data.latitude) : 0
  );
  const [lng, setLng] = useState<number>(
    data?.longitude ? Number(data.longitude) : 0
  );

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

  const handleAreaChange = (value: string | null) => {
    setAreaValue(value || "");
  };

  const handleNamaPopChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNamaPop(validateTextInput(e.target.value, NAMA_POP_MAX_LENGTH));
    },
    []
  );

  const handleAlamatChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAlamat(validateTextInput(e.target.value, ALAMAT_MAX_LENGTH));
    },
    []
  );

  const handlePick = (pickedLat: number, pickedLng: number) => {
    setLat(pickedLat);
    setLng(pickedLng);
  };

  // Kembalikan semua field ke nilai awal (kosong untuk create, sesuai
  // data untuk edit). Dipanggil setiap kali dialog ditutup.
  const resetForm = useCallback(() => {
    setAreaValue(data?.id_area ? String(data.id_area) : "");
    setNamaPop(data?.nama_pop ?? "");
    setAlamat(data?.alamat ?? "");
    setLat(data?.latitude ? Number(data.latitude) : 0);
    setLng(data?.longitude ? Number(data.longitude) : 0);
    setGpsError(null);
  }, [data?.id_area, data?.nama_pop, data?.alamat, data?.latitude, data?.longitude]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        resetForm();
      }
    },
    [resetForm]
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

      handleOpenChange(false);
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          mode === "create" ? (
            <Button className="cursor-pointer h-11 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white active:scale-95 transition-transform" />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer rounded-xl hover:scale-125 active:scale-90 transition-transform"
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
          <Pencil className="h-4 w-4 text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300" />
        )}
      </DialogTrigger>

      {/*
        Struktur dialog dipecah jadi 2 bagian:
        - Header: tetap (tidak ikut scroll)
        - Body (form): scroll sendiri, dengan padding di kanan supaya
          scrollbar tidak nempel di tepi/rounded corner dan custom
          styling supaya scrollbar tipis & rapi.
      */}
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden rounded-3xl p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-6 dark:border-slate-800">
          <DialogTitle>
            {mode === "create" ? "Tambah POP" : "Edit POP"}
          </DialogTitle>

          <DialogDescription>
            Lengkapi data POP di bawah ini.
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex-1 overflow-y-auto px-6 py-4
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-slate-300
            dark:[&::-webkit-scrollbar-thumb]:bg-slate-700"
        >
          <form id="pop-form" action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Area</label>

              <Select value={areaValue} onValueChange={handleAreaChange}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white focus:ring-purple-500 hover:scale-105 active:scale-95 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <SelectValue placeholder="Pilih Area">
                    {(value: string) =>
                      areas.find((area) => String(area.id_area) === value)
                        ?.nama_area ?? "Pilih Area"
                    }
                  </SelectValue>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Nama POP</label>
              <Input
                name="nama_pop"
                value={namaPop}
                onChange={handleNamaPopChange}
                placeholder="Contoh: POP Tanggerang Pusat"
                maxLength={NAMA_POP_MAX_LENGTH}
                required
                autoComplete="off"
                className="h-12 rounded-2xl border-slate-200 bg-white placeholder:text-slate-600 placeholder:font-medium focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-400">
                {namaPop.length}/{NAMA_POP_MAX_LENGTH} karakter
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Alamat</label>
              <Input
                name="alamat"
                value={alamat}
                onChange={handleAlamatChange}
                placeholder="Contoh: Jl. Merdeka No.10, Tanggerang"
                maxLength={ALAMAT_MAX_LENGTH}
                required
                autoComplete="off"
                className="h-12 rounded-2xl border-slate-200 bg-white placeholder:text-slate-600 placeholder:font-medium focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-400">
                {alamat.length}/{ALAMAT_MAX_LENGTH} karakter
              </p>
            </div>

            {/* Peta pilih lokasi GPS */}
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
              <PopMapPicker lat={lat} lng={lng} onPick={handlePick} />
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
                  className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                  className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="shrink-0 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-2xl active:scale-95 transition-transform"
            onClick={() => handleOpenChange(false)}
          >
            Batal
          </Button>

          <Button
            type="submit"
            form="pop-form"
            disabled={isSubmitting || !areaValue}
            className="cursor-pointer rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white active:scale-95 transition-transform"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};