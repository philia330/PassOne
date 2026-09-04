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

import { SearchableSelect } from "@/components/ui/searchable-select";

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

// Batas jumlah karakter untuk masing-masing input teks. Sesuaikan dengan
// panjang kolom di database (varchar) kalau ada batasan spesifik di skema Prisma-mu.
const NAMA_ODP_MAX_LENGTH = 100;
const ALAMAT_MAX_LENGTH = 255;

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

  const handleOltChange = (value: string | null) => {
    setOltValue(value || "");
  };

  const [namaOdp, setNamaOdp] = useState(data?.nama_odp ?? "");
  const [alamat, setAlamat] = useState(data?.alamat ?? "");

  const handleNamaOdpChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNamaOdp(e.target.value.slice(0, NAMA_ODP_MAX_LENGTH));
    },
    []
  );

  const handleAlamatChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAlamat(e.target.value.slice(0, ALAMAT_MAX_LENGTH));
    },
    []
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

  const handlePick = (pickedLat: number, pickedLng: number) => {
    setLat(pickedLat);
    setLng(pickedLng);
  };

  // Kembalikan semua field controlled ke nilai awal. Dipanggil setiap
  // kali dialog ditutup supaya data lama tidak nyangkut saat dibuka lagi.
  const resetForm = useCallback(() => {
    setOltValue(data?.id_olt ? String(data.id_olt) : "");
    setNamaOdp(data?.nama_odp ?? "");
    setAlamat(data?.alamat ?? "");
    setJumlahPort(data?.jumlah_port != null ? String(data.jumlah_port) : "");
    setLat(data?.latitude ? Number(data.latitude) : 0);
    setLng(data?.longitude ? Number(data.longitude) : 0);
    setGpsError(null);
  }, [
    data?.id_olt,
    data?.nama_odp,
    data?.alamat,
    data?.jumlah_port,
    data?.latitude,
    data?.longitude,
  ]);

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
        await createOdp(formData);
        toast.success("ODP berhasil ditambahkan");
      } else if (data) {
        await updateOdp(data.id_odp, formData);
        toast.success("ODP berhasil diperbarui");
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
            <Button className="cursor-pointer h-12 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 font-semibold text-white active:scale-95 hover:scale-105 transition-transform" />
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
            Tambah ODP
          </>
        ) : (
          <Pencil className="h-4 w-4 text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300" />
        )}
      </DialogTrigger>

      {/*
        Struktur dialog dipecah jadi 3 bagian supaya scrollbar tidak
        nabrak sudut rounded dan layout tidak "loncat" saat scroll:
        - Header: tetap
        - Body (form): scroll sendiri, punya padding + scrollbar custom tipis
        - Footer: tetap, tombol Simpan pakai atribut form="odp-form"
      */}
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden rounded-3xl p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-6 dark:border-slate-800">
          <DialogTitle>
            {mode === "create" ? "Tambah ODP" : "Edit ODP"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi data ODP di bawah ini.
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
          <form id="odp-form" action={handleSubmit} className="space-y-4">
            {/* OLT dipindah ke paling atas */}
            <div className="space-y-2">
              <label className="text-sm font-medium">OLT</label>

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
              <label className="text-sm font-medium">Nama ODP</label>
              <Input
                name="nama_odp"
                value={namaOdp}
                onChange={handleNamaOdpChange}
                placeholder="Contoh: ODP Tanggerang Blok A"
                maxLength={NAMA_ODP_MAX_LENGTH}
                required
                autoComplete="off"
                className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-400">
                {namaOdp.length}/{NAMA_ODP_MAX_LENGTH} karakter
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Alamat</label>
              <Input
                name="alamat"
                value={alamat}
                onChange={handleAlamatChange}
                placeholder="Contoh: Jl. Sukup No.15, Tanggerang"
                maxLength={ALAMAT_MAX_LENGTH}
                required
                autoComplete="off"
                className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-400">
                {alamat.length}/{ALAMAT_MAX_LENGTH} karakter
              </p>
            </div>

            {/* Jumlah Port - setelah Alamat, sebelum Peta */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Jumlah Port
              </label>
              <Input
                name="jumlah_port"
                type="number"
                min={1}
                value={jumlahPort}
                onChange={(e) => setJumlahPort(e.target.value)}
                placeholder="Contoh: 16"
                required
                className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Peta pilih lokasi */}
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
          </form>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            className="h-11 cursor-pointer rounded-2xl active:scale-95 hover:scale-105 transition-transform dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={() => handleOpenChange(false)}
          >
            Batal
          </Button>

          <Button
            type="submit"
            form="odp-form"
            disabled={isSubmitting || !oltValue}
            className="h-11 cursor-pointer rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 font-semibold text-white active:scale-95 hover:scale-105 transition-transform"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};