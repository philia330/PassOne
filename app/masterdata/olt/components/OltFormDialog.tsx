"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { Pencil, Plus, Loader2, Navigation, ImageIcon } from "lucide-react";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
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

// Batas jumlah karakter untuk masing-masing input teks
const NAMA_OLT_MAX_LENGTH = 100;
const IP_OLT_MAX_LENGTH = 45; // cukup untuk IPv4 maupun IPv6
const USERNAME_OLT_MAX_LENGTH = 50;

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

  const [namaOlt, setNamaOlt] = useState(data?.nama_olt ?? "");
  const [ipOlt, setIpOlt] = useState(data?.ip_olt ?? "");
  const [usernameOlt, setUsernameOlt] = useState(data?.username_olt ?? "");

  const handlePopChange = (value: string | null) => {
    setPopValue(value || "");
  };

  const handleNamaOltChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNamaOlt(e.target.value.slice(0, NAMA_OLT_MAX_LENGTH));
    },
    []
  );

  const handleIpOltChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIpOlt(e.target.value.slice(0, IP_OLT_MAX_LENGTH));
    },
    []
  );

  const handleUsernameOltChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUsernameOlt(e.target.value.slice(0, USERNAME_OLT_MAX_LENGTH));
    },
    []
  );

  const [lat, setLat] = useState<number>(
    data?.latitude ? Number(data.latitude) : 0
  );
  const [lng, setLng] = useState<number>(
    data?.longitude ? Number(data.longitude) : 0
  );

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // ================================================================
  // FOTO OLT -- dropzone custom dengan preview + bisa langsung kamera
  // ================================================================
  const [fotoPreview, setFotoPreview] = useState<string | null>(
    data?.foto_olt ?? null
  );
  const [fotoFileName, setFotoFileName] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFotoPreview(URL.createObjectURL(file));
      setFotoFileName(file.name);
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsLoading(false);
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
      () => {
        // GPS gagal - einfach saja, peta tetap bisa dipakai
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const lokasi = useMemo(() => {
    const selectedPop = pops.find((p) => String(p.id_pop) === popValue);
    return selectedPop ? selectedPop.alamat : (data?.lokasi ?? "");
  }, [popValue, pops, data?.lokasi]);

  const handlePick = (pickedLat: number, pickedLng: number) => {
    setLat(pickedLat);
    setLng(pickedLng);
  };

  // Kembalikan semua field controlled ke nilai awal. Dipanggil setiap
  // kali dialog ditutup supaya data lama tidak nyangkut saat dibuka lagi.
  const resetForm = useCallback(() => {
    setPopValue(data?.id_pop ? String(data.id_pop) : "");
    setNamaOlt(data?.nama_olt ?? "");
    setIpOlt(data?.ip_olt ?? "");
    setUsernameOlt(data?.username_olt ?? "");
    setLat(data?.latitude ? Number(data.latitude) : 0);
    setLng(data?.longitude ? Number(data.longitude) : 0);
    setGpsError(null);
    setFotoPreview(data?.foto_olt ?? null);
    setFotoFileName(null);
    if (fotoInputRef.current) fotoInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }, [
    data?.id_pop,
    data?.nama_olt,
    data?.ip_olt,
    data?.username_olt,
    data?.latitude,
    data?.longitude,
    data?.foto_olt,
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
        await createOlt(formData);
        toast.success("OLT berhasil ditambahkan");
      } else if (data) {
        await updateOlt(data.id_olt, formData);
        toast.success("OLT berhasil diperbarui");
      }
      handleOpenChange(false);
    } catch {
      toast.error("Terjadi kesalahan, silakan coba lagi");
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
            Tambah OLT
          </>
        ) : (
          <Pencil className="h-4 w-4 text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300" />
        )}
      </DialogTrigger>

      {/*
        Struktur dialog dipecah jadi 3 bagian supaya scrollbar tidak
        nabrak sudut rounded lagi:
        - Header: tetap
        - Body (form): scroll sendiri, punya padding + scrollbar custom tipis
        - Footer: tetap, tombol Simpan pakai atribut form="olt-form"
      */}
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden rounded-3xl p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-6 dark:border-slate-800">
          <DialogTitle>
            {mode === "create" ? "Tambah OLT" : "Edit OLT"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi data perangkat OLT di bawah ini.
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
          <form id="olt-form" action={handleSubmit} className="space-y-4">
            {/* POP - paling atas */}
            <div className="space-y-2">
              <label className="text-sm font-medium">POP</label>
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
              <label className="text-sm font-medium">Nama OLT</label>
              <Input
                name="nama_olt"
                value={namaOlt}
                onChange={handleNamaOltChange}
                placeholder="Contoh: OLT Huawei Tanggerang 1"
                maxLength={NAMA_OLT_MAX_LENGTH}
                required
                autoComplete="off"
                className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-400">
                {namaOlt.length}/{NAMA_OLT_MAX_LENGTH} karakter
              </p>
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
              <label className="text-sm font-medium">IP Address</label>
              <Input
                name="ip_olt"
                value={ipOlt}
                onChange={handleIpOltChange}
                placeholder="Contoh: 192.168.1.1"
                maxLength={IP_OLT_MAX_LENGTH}
                required
                autoComplete="off"
                className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-400">
                {ipOlt.length}/{IP_OLT_MAX_LENGTH} karakter
              </p>
            </div>

            {/* Username & Password */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  name="username_olt"
                  value={usernameOlt}
                  onChange={handleUsernameOltChange}
                  placeholder="admin"
                  maxLength={USERNAME_OLT_MAX_LENGTH}
                  required
                  autoComplete="off"
                  className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-400">
                  {usernameOlt.length}/{USERNAME_OLT_MAX_LENGTH} karakter
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <PasswordInput
                  name="password_olt"
                  defaultValue={data?.password_olt ?? ""}
                  placeholder="••••••••"
                  required
                  className="h-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* ================================================ */}
            {/* FOTO OLT -- dropzone custom, preview + bisa kamera */}
            {/* ================================================ */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Foto OLT</label>

              {/* Input file biasa (galeri) -- disembunyikan */}
              <input
                ref={fotoInputRef}
                name="foto_olt"
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                required={!data?.foto_olt}
                className="sr-only"
              />

              {/* Input khusus kamera -- atribut capture memicu buka kamera langsung di HP */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  handleFotoChange(e);
                  // Sinkronkan file yang dipilih dari kamera ke input utama supaya ikut ke-submit
                  if (fotoInputRef.current && e.target.files?.[0]) {
                    const dt = new DataTransfer();
                    dt.items.add(e.target.files[0]);
                    fotoInputRef.current.files = dt.files;
                  }
                }}
                className="sr-only"
              />

              <button
                type="button"
                onClick={() => fotoInputRef.current?.click()}
                className="group relative w-full overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-purple-300 hover:bg-purple-50/50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-purple-700 dark:hover:bg-purple-500/10"
              >
                {fotoPreview ? (
                  <div className="relative">
                    <Image
                      src={fotoPreview}
                      alt="Preview foto OLT"
                      width={400}
                      height={160}
                      unoptimized
                      className="h-40 w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                      <span className="rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700">
                        Ganti Foto
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 px-4 py-8">
                    <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-500/20">
                      <ImageIcon size={20} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Klik untuk pilih foto dari galeri
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      JPG, PNG — maks. 5MB
                    </p>
                  </div>
                )}
              </button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full rounded-xl h-10 text-sm border-purple-200 text-purple-700 hover:bg-purple-50 gap-1.5 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-500/10"
              >
                <ImageIcon className="h-4 w-4" />
                Ambil Foto dengan Kamera
              </Button>

              {fotoFileName && (
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  File dipilih: <span className="font-medium">{fotoFileName}</span>
                </p>
              )}

              {data?.foto_olt && !fotoFileName && (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Foto saat ini ditampilkan di atas. Pilih foto baru kalau mau menggantinya.
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
              {lat !== 0 && lng !== 0 && (
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
            form="olt-form"
            disabled={isSubmitting}
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