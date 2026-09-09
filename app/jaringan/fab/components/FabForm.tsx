"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Tag,
  User,
  IdCard,
  Phone,
  MapPin,
  Locate,
  Activity,
  Building2,
  Package,
  UserCog,
  Lock,
  Maximize2,
  Minimize2,
  Loader2,
  Search,
  ImageIcon,
  Camera,
  Navigation,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type {
  FabData,
  AreaOption,
  PaketOption,
  UserOption,
  StatusFab,
  CurrentUser,
} from "@/types/fab";

// Leaflet butuh akses `window`, jadi wajib di-load khusus di client
// (ssr: false) -- tidak bisa dirender di server.
const LocationPickerMap = dynamic(() => import("@/components/shared/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] w-full rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400 dark:bg-slate-800 dark:text-slate-500">
      Memuat peta...
    </div>
  ),
});

interface FabFormProps {
  defaultValues?: FabData;
  kodeOtomatis?: string;
  areaOptions: AreaOption[];
  paketOptions: PaketOption[];
  salesOptions: UserOption[];
  currentUser: CurrentUser;
}

const STATUS_LABEL: Record<StatusFab, string> = {
  OPEN: "Open",
  AKTIF: "Aktif",
};

// Batas panjang -- NIK Indonesia selalu 16 digit pas, No. HP dibatasi
// maksimal 14 digit (cukup untuk format 08xx / +62xx terpanjang).
const NIK_LENGTH = 16;
const NO_HP_MAX_LENGTH = 14;
const NO_HP_MIN_LENGTH = 9; // batas bawah wajar buat No. HP Indonesia

// Titik tengah default peta kalau user belum isi alamat/koordinat sama
// sekali -- biar peta tetap kelihatan dari awal, tidak perlu nunggu
// alamat diisi dulu. Ini CUMA posisi tampilan peta, bukan nilai yang
// otomatis ikut tersimpan -- baru masuk ke field Latitude/Longitude
// kalau user beneran klik/geser pin atau isi alamat/pencarian.
const DEFAULT_MAP_LAT = -6.917464; // Bandung
const DEFAULT_MAP_LNG = 107.619123;

// ==========================================================
// Tanda wajib (*) merah -- dipasang di sebelah label field yang
// harus diisi supaya user langsung tahu tanpa perlu coba submit dulu.
// ==========================================================
const RequiredMark = () => (
  <span className="text-red-500 ml-0.5" aria-hidden="true">
    *
  </span>
);

export const FabForm = ({
  defaultValues,
  kodeOtomatis,
  areaOptions,
  paketOptions,
  salesOptions,
  currentUser,
}: FabFormProps) => {
  const isTeknisi = currentUser.role === "TEKNISI";

  // Sales / Referral (SATU state ini saja -- jangan dideklarasikan dua kali)
  const [idUser, setIdUser] = useState<string>(
    defaultValues?.id_user
      ? String(defaultValues.id_user)
      : isTeknisi
      ? ""
      : String(currentUser.id_user)
  );

  const status: StatusFab = defaultValues?.status ?? "OPEN";
  const [idArea, setIdArea] = useState<string>(
    defaultValues?.id_area ? String(defaultValues.id_area) : ""
  );
  const [idPaket, setIdPaket] = useState<string>(
    defaultValues?.id_paket ? String(defaultValues.id_paket) : ""
  );

  // ==========================================================
  // VALIDASI VISUAL -- satu state error + satu "pemicu getar" yang
  // dipakai bareng-bareng oleh semua field. Field ditandai invalid
  // lewat event `onInvalid` bawaan HTML5 (otomatis muncul begitu form
  // dicoba disubmit dan field yang required/salah format belum terisi
  // benar), atau lewat pengecekan manual (mis. NIK belum 16 digit).
  // ==========================================================
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [shakeField, setShakeField] = useState<string | null>(null);

  const markInvalid = (field: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: true }));
    setShakeField(field);
    window.setTimeout(() => {
      setShakeField((current) => (current === field ? null : current));
    }, 500);
  };

  const markValid = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Gabungan class border+ring merah, ditambah animasi getar SELAMA
  // 0.4 detik setelah field itu baru saja terdeteksi invalid.
  const errorClass = (field: string) =>
    [
      fieldErrors[field]
        ? "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-400"
        : "",
      shakeField === field ? "field-shake" : "",
    ]
      .filter(Boolean)
      .join(" ");

  // ==========================================================
  // NIK & NO. HP -- controlled, cuma nerima digit, dibatasi panjangnya
  // supaya user tidak asal ketik angka sepanjang apapun. Sekaligus
  // pakai setCustomValidity supaya "kurang dari 16/9 digit" ikut
  // dianggap invalid oleh browser (bukan cuma "kosong").
  // ==========================================================
  const [nik, setNik] = useState(defaultValues?.nik ?? "");
  const [noHp, setNoHp] = useState(defaultValues?.no_hp ?? "");

  const handleNikChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, NIK_LENGTH);
    setNik(digitsOnly);

    if (digitsOnly.length === 0) {
      e.target.setCustomValidity("NIK wajib diisi");
    } else if (digitsOnly.length < NIK_LENGTH) {
      e.target.setCustomValidity("NIK harus tepat 16 digit");
    } else {
      e.target.setCustomValidity("");
      markValid("nik");
    }
  };

  const handleNoHpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, NO_HP_MAX_LENGTH);
    setNoHp(digitsOnly);

    if (digitsOnly.length === 0) {
      e.target.setCustomValidity("Nomor HP wajib diisi");
    } else if (digitsOnly.length < NO_HP_MIN_LENGTH) {
      e.target.setCustomValidity("Nomor HP terlalu pendek");
    } else {
      e.target.setCustomValidity("");
      markValid("no_hp");
    }
  };

  // ==========================================================
  // LOKASI MAP: alamat -> auto-geocode -> latitude/longitude -> peta
  // ==========================================================
  const [alamat, setAlamat] = useState(defaultValues?.alamat ?? "");
  const [fotoPreview, setFotoPreview] = useState<string | null>(defaultValues?.foto ?? null);
  const [fotoFileName, setFotoFileName] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const fotoRequired = !defaultValues?.foto;

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFotoPreview(URL.createObjectURL(file));
      setFotoFileName(file.name);
      markValid("foto");
    }
  }

  // Input file yang sama dipakai untuk dua mode -- atribut "capture" di-set
  // atau dilepas sesaat sebelum di-trigger. Di Android/iOS ini langsung
  // membuka kamera (capture) atau galeri (tanpa capture). Di Windows/desktop,
  // browser mengabaikan "capture" sepenuhnya, jadi dua-duanya sama-sama
  // membuka File Explorer biasa -- tidak ada yang error.
  function openCamera() {
    fotoInputRef.current?.setAttribute("capture", "environment");
    fotoInputRef.current?.click();
  }

  function openGallery() {
    fotoInputRef.current?.removeAttribute("capture");
    fotoInputRef.current?.click();
  }

  const [latitude, setLatitude] = useState(
    defaultValues?.latitude !== undefined ? String(defaultValues.latitude) : ""
  );
  const [longitude, setLongitude] = useState(
    defaultValues?.longitude !== undefined ? String(defaultValues.longitude) : ""
  );
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Kolom pencarian TERPISAH khusus di section "Lokasi Map" -- tidak
  // menimpa isi field Alamat Lengkap, cuma menggeser peta + lat/long.
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearching, setMapSearching] = useState(false);
  const [mapSearchError, setMapSearchError] = useState<string | null>(null);

  // ✅ Perbaikan 1: Gunakan conditional rendering, bukan setState di effect
  const shouldShowMapError = mapSearchQuery.trim().length > 0 && mapSearchQuery.trim().length < 3;

  useEffect(() => {
    // ✅ Hanya jalankan search jika query >= 3 karakter
    if (mapSearchQuery.trim().length < 3) {
      // Tidak ada setState di sini
      return;
    }

    const timer = setTimeout(async () => {
      setMapSearching(true);
      setMapSearchError(null);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=id&q=${encodeURIComponent(
            mapSearchQuery
          )}`
        );
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setLatitude(Number(data[0].lat).toFixed(6));
          setLongitude(Number(data[0].lon).toFixed(6));
          setMapSearchError(null);
          markValid("latitude");
          markValid("longitude");
        } else {
          setMapSearchError("Daerah/alamat tidak ditemukan.");
        }
      } catch {
        setMapSearchError("Gagal menghubungi layanan peta, coba lagi.");
      } finally {
        setMapSearching(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [mapSearchQuery]);

  // Skip auto-geocode sekali di render pertama (mode edit sudah punya
  // koordinat tersimpan, jangan langsung ditimpa cuma karena alamat "berubah").
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // ✅ Perbaikan 2: Hanya proses jika alamat cukup panjang
    if (alamat.trim().length < 8) {
      // Tidak ada setState di sini
      return;
    }

    // Debounce 900ms supaya request baru dikirim setelah user berhenti mengetik,
    // dan tidak membanjiri Nominatim (kebijakan pemakaian wajar mereka).
    const timer = setTimeout(async () => {
      setGeocoding(true);
      setGeocodeError(null);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=id&q=${encodeURIComponent(
            alamat
          )}`
        );
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setLatitude(Number(data[0].lat).toFixed(6));
          setLongitude(Number(data[0].lon).toFixed(6));
          setGeocodeError(null);
          markValid("latitude");
          markValid("longitude");
        } else {
          setGeocodeError("Lokasi tidak ditemukan, isi Latitude/Longitude manual.");
        }
      } catch {
        setGeocodeError("Gagal menghubungi layanan peta, coba lagi.");
      } finally {
        setGeocoding(false);
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [alamat]);

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  const hasValidCoords = !Number.isNaN(lat) && !Number.isNaN(lon);

  // Titik yang DITAMPILKAN di peta: pakai koordinat asli kalau sudah ada,
  // kalau belum, pakai default (Bandung) supaya peta tetap muncul dari awal.
  const displayLat = hasValidCoords ? lat : DEFAULT_MAP_LAT;
  const displayLng = hasValidCoords ? lon : DEFAULT_MAP_LNG;

  // ✅ Fungsi untuk mendapatkan nama dari ID
  const getAreaName = (id: string) => {
    const area = areaOptions.find((a) => String(a.id_area) === id);
    return area?.nama_area || "Pilih area";
  };

  const getPaketName = (id: string) => {
    const paket = paketOptions.find((p) => String(p.id_paket) === id);
    return paket?.nama_paket || "Pilih paket";
  };

  const getSalesName = (id: string) => {
    const sales = salesOptions.find((s) => String(s.id_user) === id);
    return sales?.nama || "Pilih sales";
  };

  // Fungsi untuk mendapatkan lokasi GPS saat ini
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsLoading(false);
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    // Langsung panggil getCurrentPosition - browser akan otomatis munculkan popup izin Chrome
    // Jika user sebelumnya sudah "deny", popup tidak akan muncul lagi (tergantung browser)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLatitude(latitude.toFixed(6));
        setLongitude(longitude.toFixed(6));
        setGpsLoading(false);
        setGeocodeError(null);
        setGpsError(null);
        markValid("latitude");
        markValid("longitude");
      },
      () => {
        // GPS gagal - einfach saja, peta tetap bisa dipakai, tidak ada error message
        setGpsLoading(false);
        setGpsError(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  return (
    <>
      {/* Animasi getar dipakai bareng di semua field -- scoped ke
          komponen ini saja lewat styled-jsx, tidak perlu ubah
          tailwind.config. */}
      <style jsx>{`
        @keyframes field-shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-6px);
          }
          40% {
            transform: translateX(6px);
          }
          60% {
            transform: translateX(-4px);
          }
          80% {
            transform: translateX(4px);
          }
        }
        .field-shake {
          animation: field-shake 0.4s ease-in-out;
        }
      `}</style>

      {/* FIX: scroll HANYA di DialogContent (components/ui/dialog.tsx), tidak
          lagi di sini -- sebelumnya dua-duanya punya overflow-y-auto sendiri,
          jadi numpuk 2 scrollbar + horizontal scroll aneh. p-1.5 -m-1.5 tetap
          dipakai supaya ring fokus ungu tidak kepotong. */}
      <div className="grid grid-cols-2 gap-5 p-1.5 -m-1.5">
        <div className="col-span-2 space-y-2">
          <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Tag size={13} className="text-purple-500" /> Kode FAB
          </Label>
          <div className="relative">
            <Input
              value={defaultValues?.kode_fab ?? kodeOtomatis ?? ""}
              readOnly
              className="rounded-2xl h-12 border-slate-200 bg-slate-50 font-mono font-semibold text-slate-500 cursor-not-allowed pr-10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            />
            <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">Dibuat otomatis, tidak bisa diubah manual</p>
        </div>

        {/* ================================================ */}
        {/* FOTO DEPAN RUMAH -- dropzone custom + kamera & galeri */}
        {/* ================================================ */}
        <div className="col-span-2 space-y-2">
          <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <ImageIcon size={13} className="text-purple-500" /> Foto Depan Rumah
            {fotoRequired && <RequiredMark />}
          </Label>

          {/* Input asli disembunyikan -- semua interaksi lewat dropzone/tombol custom di bawah */}
          <input
            ref={fotoInputRef}
            name="foto"
            type="file"
            accept="image/*"
            onChange={handleFotoChange}
            onInvalid={() => markInvalid("foto")}
            required={fotoRequired}
            className="sr-only"
          />

          <button
            type="button"
            onClick={openGallery}
            className={`group relative w-full overflow-hidden rounded-2xl border-2 border-dashed bg-slate-50 transition-colors hover:border-purple-300 hover:bg-purple-50/50 dark:bg-slate-800/50 dark:hover:border-purple-700 dark:hover:bg-purple-500/10 ${
              fieldErrors.foto ? "border-red-500" : "border-slate-200 dark:border-slate-700"
            } ${shakeField === "foto" ? "field-shake" : ""}`}
          >
            {fotoPreview ? (
              <div className="relative">
                <img
                  src={fotoPreview}
                  alt="Preview foto depan rumah"
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
                  Klik untuk pilih foto
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  JPG, PNG — maks. 5MB
                </p>
              </div>
            )}
          </button>

          {/* Ambil Foto (kamera) & Pilih dari Galeri -- input yang sama, cuma
              atribut capture-nya beda sebelum di-trigger. Di desktop dua-duanya
              sama-sama buka File Explorer, tidak masalah. */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={openCamera}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-purple-300 hover:text-purple-600 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-purple-700 dark:hover:text-purple-400"
            >
              <Camera size={14} /> Ambil Foto
            </button>
            <button
              type="button"
              onClick={openGallery}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-purple-300 hover:text-purple-600 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-purple-700 dark:hover:text-purple-400"
            >
              <ImageIcon size={14} /> Pilih dari Galeri
            </button>
          </div>

          {fieldErrors.foto && (
            <p className="text-xs text-red-500">Foto depan rumah wajib diisi.</p>
          )}

          {fotoFileName && (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              File dipilih: <span className="font-medium">{fotoFileName}</span>
            </p>
          )}

          {defaultValues?.foto && !fotoFileName && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Kosongkan kalau tidak ingin mengganti foto.
            </p>
          )}
        </div>

        <div className="col-span-2 space-y-2">
          <Label
            htmlFor="nama_pelanggan"
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            <User size={13} className="text-purple-500" /> Nama Pelanggan
            <RequiredMark />
          </Label>
          <Input
            id="nama_pelanggan"
            name="nama_pelanggan"
            placeholder="Masukkan nama pelanggan"
            defaultValue={defaultValues?.nama_pelanggan}
            autoComplete="off"
            className={`rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${errorClass(
              "nama_pelanggan"
            )}`}
            onInvalid={() => markInvalid("nama_pelanggan")}
            onChange={(e) => {
              if (e.target.value.trim()) markValid("nama_pelanggan");
            }}
            required
          />
          {fieldErrors.nama_pelanggan && (
            <p className="text-xs text-red-500">Nama pelanggan wajib diisi.</p>
          )}
        </div>

        {/* NIK -- cuma nerima digit, dikunci pas 16 digit */}
        <div className="space-y-2">
          <Label
            htmlFor="nik"
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            <IdCard size={13} className="text-purple-500" /> NIK
            <RequiredMark />
          </Label>
          <Input
            id="nik"
            name="nik"
            inputMode="numeric"
            pattern="\d*"
            placeholder="Masukkan 16 digit NIK"
            maxLength={NIK_LENGTH}
            value={nik}
            onChange={handleNikChange}
            onInvalid={() => markInvalid("nik")}
            autoComplete="off"
            className={`rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${errorClass(
              "nik"
            )}`}
            required
          />
          {nik.length > 0 && nik.length < NIK_LENGTH && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {nik.length}/{NIK_LENGTH} digit -- NIK harus tepat 16 digit.
            </p>
          )}
          {fieldErrors.nik && nik.length === 0 && (
            <p className="text-xs text-red-500">NIK wajib diisi.</p>
          )}
        </div>

        {/* No. HP -- cuma nerima digit, dibatasi maksimal 14 digit */}
        <div className="space-y-2">
          <Label
            htmlFor="no_hp"
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            <Phone size={13} className="text-purple-500" /> No. HP
            <RequiredMark />
          </Label>
          <Input
            id="no_hp"
            name="no_hp"
            inputMode="numeric"
            pattern="\d*"
            placeholder="08xxxxxxxxxx"
            maxLength={NO_HP_MAX_LENGTH}
            value={noHp}
            onChange={handleNoHpChange}
            onInvalid={() => markInvalid("no_hp")}
            autoComplete="off"
            className={`rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${errorClass(
              "no_hp"
            )}`}
            required
          />
          {fieldErrors.no_hp && (
            <p className="text-xs text-red-500">
              {noHp.length === 0 ? "Nomor HP wajib diisi." : "Nomor HP terlalu pendek."}
            </p>
          )}
        </div>

        <div className="col-span-2 space-y-2">
          <Label
            htmlFor="alamat"
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            <MapPin size={13} className="text-purple-500" /> Alamat Lengkap
            <RequiredMark />
          </Label>
          <textarea
            id="alamat"
            name="alamat"
            rows={2}
            placeholder="Masukkan alamat lengkap pelanggan"
            value={alamat}
            onChange={(e) => {
              setAlamat(e.target.value);
              if (e.target.value.trim()) markValid("alamat");
            }}
            onInvalid={() => markInvalid("alamat")}
            autoComplete="off"
            className={`w-full rounded-2xl border p-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 resize-none dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${
              fieldErrors.alamat
                ? "border-red-500 focus:ring-red-500 focus:border-red-400"
                : "border-slate-200 dark:border-slate-700"
            } ${shakeField === "alamat" ? "field-shake" : ""}`}
            required
          />
          {geocoding && (
            <p className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400">
              <Loader2 size={12} className="animate-spin" /> Mencari lokasi dari alamat...
            </p>
          )}
          {fieldErrors.alamat && (
            <p className="text-xs text-red-500">Alamat lengkap wajib diisi.</p>
          )}
          {/* ✅ Perbaikan: Tampilkan error hanya jika ada dan alamat cukup panjang */}
          {!geocoding && geocodeError && alamat.trim().length >= 8 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">{geocodeError}</p>
          )}
        </div>

        {/* ================================================ */}
        {/* AREA / PAKET / PENGINPUT / STATUS -- dipindah        */}
        {/* ke sini, persis sesudah Alamat Lengkap             */}
        {/* ================================================ */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Building2 size={13} className="text-purple-500" /> Area
            <RequiredMark />
          </Label>
          <div
            className={`rounded-2xl ${
              fieldErrors.id_area ? "ring-2 ring-red-500" : ""
            } ${shakeField === "id_area" ? "field-shake" : ""}`}
          >
            <SearchableSelect
              value={idArea}
              onValueChange={(v) => {
                setIdArea(v);
                markValid("id_area");
              }}
              options={areaOptions.map((a) => ({
                value: String(a.id_area),
                label: a.nama_area,
              }))}
              placeholder="Pilih area"
              searchPlaceholder="Cari nama area..."
              emptyText="Area tidak ditemukan"
            />
          </div>
          {/* Input "hantu" (bukan type=hidden) supaya tetap ikut validasi
              HTML5 -- type=hidden dikecualikan dari constraint validation
              browser, jadi required-nya tidak akan pernah kedeteksi. */}
          <input
            type="text"
            name="id_area"
            value={idArea}
            onChange={() => {}}
            onInvalid={() => markInvalid("id_area")}
            required
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />
          {fieldErrors.id_area && (
            <p className="text-xs text-red-500">Area wajib dipilih.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Package size={13} className="text-purple-500" /> Paket Internet
            <RequiredMark />
          </Label>
          <div
            className={`rounded-2xl ${
              fieldErrors.id_paket ? "ring-2 ring-red-500" : ""
            } ${shakeField === "id_paket" ? "field-shake" : ""}`}
          >
            <SearchableSelect
              value={idPaket}
              onValueChange={(v) => {
                setIdPaket(v);
                markValid("id_paket");
              }}
              options={paketOptions.map((p) => ({
                value: String(p.id_paket),
                label: p.nama_paket,
              }))}
              placeholder="Pilih paket"
              searchPlaceholder="Cari nama paket..."
              emptyText="Paket tidak ditemukan"
            />
          </div>
          <input
            type="text"
            name="id_paket"
            value={idPaket}
            onChange={() => {}}
            onInvalid={() => markInvalid("id_paket")}
            required
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />
          {fieldErrors.id_paket && (
            <p className="text-xs text-red-500">Paket internet wajib dipilih.</p>
          )}
        </div>

        {/* Penginput / Referral -- kondisional sesuai role yang login:
            - TEKNISI: field jadi "Referral", tetap dropdown pilih sales
            - selain itu (Sales/Admin/Leader/Logistik): dikunci ke nama sendiri,
              labelnya "Penginput" karena memang dialah yang menginput data ini */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <UserCog size={13} className="text-purple-500" /> {isTeknisi ? "Referral" : "Penginput"}
            <RequiredMark />
          </Label>

          {isTeknisi ? (
            <>
              <div
                className={`rounded-2xl ${
                  fieldErrors.id_user ? "ring-2 ring-red-500" : ""
                } ${shakeField === "id_user" ? "field-shake" : ""}`}
              >
                <SearchableSelect
                  value={idUser}
                  onValueChange={(v) => {
                    setIdUser(v);
                    markValid("id_user");
                  }}
                  options={salesOptions.map((u) => ({
                    value: String(u.id_user),
                    label: u.nama,
                  }))}
                  placeholder="Pilih sales referral"
                  searchPlaceholder="Cari nama sales..."
                  emptyText="Sales tidak ditemukan"
                />
              </div>
              <input
                type="text"
                name="id_user"
                value={idUser}
                onChange={() => {}}
                onInvalid={() => markInvalid("id_user")}
                required
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
              />
              {fieldErrors.id_user && (
                <p className="text-xs text-red-500">Referral wajib dipilih.</p>
              )}
            </>
          ) : (
            <>
              <div className="relative">
                <Input
                  value={currentUser.nama}
                  readOnly
                  className="rounded-2xl h-12 border-slate-200 bg-slate-50 font-semibold text-slate-500 cursor-not-allowed pr-10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                />
                <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              </div>
              <input type="hidden" name="id_user" value={idUser} required />
            </>
          )}
        </div>

        {isTeknisi && (
          <div className="col-span-2 space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <User size={13} className="text-purple-500" /> Nama Teknisi (Penginput)
            </Label>
            <div className="relative">
              <Input
                value={currentUser.nama}
                readOnly
                className="rounded-2xl h-12 border-slate-200 bg-slate-50 font-semibold text-slate-500 cursor-not-allowed pr-10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              />
              <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Tercatat otomatis sebagai yang menginput data ini.</p>
          </div>
        )}

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Activity size={13} className="text-purple-500" /> Status
          </Label>
          <div className="relative">
            <Input
              value={STATUS_LABEL[status]}
              readOnly
              className="rounded-2xl h-12 border-slate-200 bg-slate-50 font-semibold text-slate-500 cursor-not-allowed pr-10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            />
            <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Otomatis berubah jadi Aktif setelah BAA instalasi diselesaikan
          </p>
          <input type="hidden" name="status" value={status} />
        </div>

        {/* ================================================ */}
        {/* LOKASI MAP -- label section, di atas peta */}
        {/* ================================================ */}
        <div className="col-span-2">
          <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <MapPin size={13} className="text-purple-500" /> Lokasi Map
          </Label>
          <p className="text-xs text-slate-400 mt-1 mb-2 dark:text-slate-500">
            Terisi otomatis dari Alamat Lengkap. Atau ketik nama daerah/alamat di kolom ini khusus
            buat geser peta, bisa juga digeser/klik langsung di peta di bawah, atau gunakan tombol GPS di atas peta.
          </p>
          <div className="relative mt-2">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              value={mapSearchQuery}
              onChange={(e) => setMapSearchQuery(e.target.value)}
              placeholder="Cari daerah atau alamat untuk menggeser peta"
              autoComplete="off"
              className="rounded-2xl h-11 pl-10 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            {mapSearching && (
              <Loader2
                size={14}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-500 animate-spin dark:text-purple-400"
              />
            )}
          </div>
          {/* ✅ Perbaikan: Conditional rendering untuk error map search */}
          {shouldShowMapError ? (
            <p className="text-xs text-yellow-600 mt-1 dark:text-yellow-400">Minimal 3 karakter untuk mencari lokasi</p>
          ) : mapSearchError && mapSearchQuery.trim().length >= 3 ? (
            <p className="text-xs text-amber-600 mt-1 dark:text-amber-400">{mapSearchError}</p>
          ) : null}
        </div>

        {/* Peta -- SELALU muncul (default Bandung) supaya tidak perlu isi
            alamat dulu buat lihat petanya. Tombol GPS & Perbesar/Perkecil
            disatukan di baris yang sama, sejajar di atas peta. */}
        <div className="col-span-2 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {hasValidCoords
                ? "Klik atau geser pin untuk ubah titik lokasi"
                : "Klik atau geser pin di peta untuk pilih lokasi pelanggan"}
            </p>

            <div className="flex items-center gap-2">
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

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMapExpanded((v) => !v)}
                className="rounded-xl h-8 text-xs border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-500/10"
              >
                {mapExpanded ? (
                  <>
                    <Minimize2 className="mr-1 h-3.5 w-3.5" /> Perkecil
                  </>
                ) : (
                  <>
                    <Maximize2 className="mr-1 h-3.5 w-3.5" /> Perbesar
                  </>
                )}
              </Button>
            </div>
          </div>

          {hasValidCoords ? (
            <p className="text-xs text-emerald-500 dark:text-emerald-400">
              Lokasi tersimpan: {latitude}, {longitude}
            </p>
          ) : null}

          <LocationPickerMap
            lat={displayLat}
            lng={displayLng}
            height={mapExpanded ? "420px" : "220px"}
            onChange={(newLat, newLng) => {
              setLatitude(newLat.toFixed(6));
              setLongitude(newLng.toFixed(6));
              markValid("latitude");
              markValid("longitude");
            }}
          />
        </div>

        {/* ================================================ */}
        {/* LATITUDE / LONGITUDE -- dipindah ke BAWAH peta */}
        {/* ================================================ */}
        <div className="space-y-2">
          <Label
            htmlFor="latitude"
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            <Locate size={13} className="text-purple-500" /> Latitude
            <RequiredMark />
          </Label>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            placeholder="Terisi otomatis dari alamat/peta"
            value={latitude}
            onChange={(e) => {
              setLatitude(e.target.value);
              if (e.target.value.trim()) markValid("latitude");
            }}
            onInvalid={() => markInvalid("latitude")}
            autoComplete="off"
            className={`rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${errorClass(
              "latitude"
            )}`}
            required
          />
          {fieldErrors.latitude && (
            <p className="text-xs text-red-500">Latitude wajib diisi.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="longitude"
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            <Locate size={13} className="text-purple-500" /> Longitude
            <RequiredMark />
          </Label>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            placeholder="Terisi otomatis dari alamat/peta"
            value={longitude}
            onChange={(e) => {
              setLongitude(e.target.value);
              if (e.target.value.trim()) markValid("longitude");
            }}
            onInvalid={() => markInvalid("longitude")}
            autoComplete="off"
            className={`rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${errorClass(
              "longitude"
            )}`}
            required
          />
          {fieldErrors.longitude && (
            <p className="text-xs text-red-500">Longitude wajib diisi.</p>
          )}
        </div>
      </div>
    </>
  );
};