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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <div className="h-[220px] w-full rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400">
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

// Titik tengah default peta kalau user belum isi alamat/koordinat sama
// sekali -- biar peta tetap kelihatan dari awal, tidak perlu nunggu
// alamat diisi dulu. Ini CUMA posisi tampilan peta, bukan nilai yang
// otomatis ikut tersimpan -- baru masuk ke field Latitude/Longitude
// kalau user beneran klik/geser pin atau isi alamat/pencarian.
const DEFAULT_MAP_LAT = -6.917464; // Bandung
const DEFAULT_MAP_LNG = 107.619123;

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
  // LOKASI MAP: alamat -> auto-geocode -> latitude/longitude -> peta
  // ==========================================================
  const [alamat, setAlamat] = useState(defaultValues?.alamat ?? "");
  const [fotoPreview, setFotoPreview] = useState<string | null>(defaultValues?.foto ?? null);

    function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (file) {
        setFotoPreview(URL.createObjectURL(file));
      }
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

  return (
    // FIX: scroll HANYA di DialogContent (components/ui/dialog.tsx), tidak
    // lagi di sini -- sebelumnya dua-duanya punya overflow-y-auto sendiri,
    // jadi numpuk 2 scrollbar + horizontal scroll aneh. p-1.5 -m-1.5 tetap
    // dipakai supaya ring fokus ungu tidak kepotong.
    <div className="grid grid-cols-2 gap-5 p-1.5 -m-1.5">
      <div className="col-span-2 space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          <Tag size={13} className="text-purple-500" /> Kode FAB
        </Label>
        <div className="relative">
          <Input
            value={defaultValues?.kode_fab ?? kodeOtomatis ?? ""}
            readOnly
            className="rounded-2xl h-12 border-slate-200 bg-slate-50 font-mono font-semibold text-slate-500 cursor-not-allowed pr-10"
          />
          <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <p className="text-xs text-slate-400">Dibuat otomatis, tidak bisa diubah manual</p>
      </div>

      <div className="col-span-2 space-y-2">
  <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
    <ImageIcon size={13} className="text-purple-500" /> Foto Depan Rumah
  </Label>

  {fotoPreview && (
    <img
      src={fotoPreview}
      alt="Preview foto depan rumah"
      className="mb-2 h-32 w-full rounded-2xl border border-slate-200 object-cover"
    />
  )}

  <Input
    name="foto"
    type="file"
    accept="image/*"
    onChange={handleFotoChange}
    required={!defaultValues?.foto}
    className="h-12 rounded-2xl border-slate-200 bg-white file:mr-3 file:h-full file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:text-sm file:font-medium focus-visible:ring-purple-500"
  />

  {defaultValues?.foto && (
    <p className="text-xs text-slate-400">Kosongkan kalau tidak ingin mengganti foto.</p>
  )}
</div>

      <div className="col-span-2 space-y-2">
        <Label
          htmlFor="nama_pelanggan"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <User size={13} className="text-purple-500" /> Nama Pelanggan
        </Label>
        <Input
          id="nama_pelanggan"
          name="nama_pelanggan"
          placeholder="Masukkan nama pelanggan"
          defaultValue={defaultValues?.nama_pelanggan}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
          required
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="nik"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <IdCard size={13} className="text-purple-500" /> NIK
        </Label>
        <Input
          id="nik"
          name="nik"
          placeholder="Masukkan 16 digit NIK"
          maxLength={16}
          defaultValue={defaultValues?.nik}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
          required
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="no_hp"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Phone size={13} className="text-purple-500" /> No. HP
        </Label>
        <Input
          id="no_hp"
          name="no_hp"
          placeholder="08xxxxxxxxxx"
          defaultValue={defaultValues?.no_hp}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
          required
        />
      </div>

      <div className="col-span-2 space-y-2">
        <Label
          htmlFor="alamat"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <MapPin size={13} className="text-purple-500" /> Alamat Lengkap
        </Label>
        <textarea
          id="alamat"
          name="alamat"
          rows={2}
          placeholder="Masukkan alamat lengkap pelanggan"
          value={alamat}
          onChange={(e) => setAlamat(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 resize-none"
          required
        />
        {geocoding && (
          <p className="flex items-center gap-1.5 text-xs text-purple-600">
            <Loader2 size={12} className="animate-spin" /> Mencari lokasi dari alamat...
          </p>
        )}
        {/* ✅ Perbaikan: Tampilkan error hanya jika ada dan alamat cukup panjang */}
        {!geocoding && geocodeError && alamat.trim().length >= 8 && (
          <p className="text-xs text-amber-600">{geocodeError}</p>
        )}
      </div>

      {/* ================================================ */}
      {/* AREA / PAKET / SALES-REFERRAL / STATUS -- dipindah */}
      {/* ke sini, persis sesudah Alamat Lengkap             */}
      {/* ================================================ */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          <Building2 size={13} className="text-purple-500" /> Area
        </Label>
        <Select value={idArea} onValueChange={(v) => setIdArea(v ?? "")}>
          <SelectTrigger className="rounded-2xl h-12 border-slate-200 focus:ring-purple-500 w-full">
            <SelectValue placeholder="Pilih area">
              {idArea ? getAreaName(idArea) : "Pilih area"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {areaOptions.map((a) => (
              <SelectItem key={a.id_area} value={String(a.id_area)}>
                {a.nama_area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="id_area" value={idArea} required />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          <Package size={13} className="text-purple-500" /> Paket Internet
        </Label>
        <Select value={idPaket} onValueChange={(v) => setIdPaket(v ?? "")}>
          <SelectTrigger className="rounded-2xl h-12 border-slate-200 focus:ring-purple-500 w-full">
            <SelectValue placeholder="Pilih paket">
              {idPaket ? getPaketName(idPaket) : "Pilih paket"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {paketOptions.map((p) => (
              <SelectItem key={p.id_paket} value={String(p.id_paket)}>
                {p.nama_paket}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="id_paket" value={idPaket} required />
      </div>

      {/* Sales / Referral -- kondisional sesuai role yang login:
          - TEKNISI: field jadi "Referral", tetap dropdown pilih sales
          - selain itu (Sales/Admin/Leader/Logistik): dikunci ke nama sendiri */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          <UserCog size={13} className="text-purple-500" /> {isTeknisi ? "Referral" : "Sales"}
        </Label>

        {isTeknisi ? (
          <Select value={idUser} onValueChange={(v) => setIdUser(v ?? "")}>
            <SelectTrigger className="rounded-2xl h-12 border-slate-200 focus:ring-purple-500 w-full">
              <SelectValue placeholder="Pilih sales referral">
                {idUser ? getSalesName(idUser) : "Pilih sales referral"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {salesOptions.map((u) => (
                <SelectItem key={u.id_user} value={String(u.id_user)}>
                  {u.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="relative">
            <Input
              value={currentUser.nama}
              readOnly
              className="rounded-2xl h-12 border-slate-200 bg-slate-50 font-semibold text-slate-500 cursor-not-allowed pr-10"
            />
            <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        )}
        
        {isTeknisi && (
  <div className="col-span-2 space-y-2">
    <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
      <User size={13} className="text-purple-500" /> Nama Teknisi (Penginput)
    </Label>
    <div className="relative">
      <Input
        value={currentUser.nama}
        readOnly
        className="rounded-2xl h-12 border-slate-200 bg-slate-50 font-semibold text-slate-500 cursor-not-allowed pr-10"
      />
      <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
    <p className="text-xs text-slate-400">Tercatat otomatis sebagai yang menginput data ini.</p>
  </div>
)}

        <input type="hidden" name="id_user" value={idUser} required />
      </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            <Activity size={13} className="text-purple-500" /> Status
          </Label>
          <div className="relative">
            <Input
              value={STATUS_LABEL[status]}
              readOnly
              className="rounded-2xl h-12 border-slate-200 bg-slate-50 font-semibold text-slate-500 cursor-not-allowed pr-10"
            />
            <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <p className="text-xs text-slate-400">
            Otomatis berubah jadi Aktif setelah BAA instalasi diselesaikan
          </p>
          <input type="hidden" name="status" value={status} />
        </div>

      {/* ================================================ */}
      {/* LOKASI MAP -- label section, di atas peta */}
      {/* ================================================ */}
      <div className="col-span-2">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          <MapPin size={13} className="text-purple-500" /> Lokasi Map
        </Label>
        <p className="text-xs text-slate-400 mt-1 mb-2">
          Terisi otomatis dari Alamat Lengkap. Atau ketik nama daerah/alamat di kolom ini khusus
          buat geser peta, bisa juga digeser/klik langsung di peta di bawah, atau diubah manual
          lewat kolom Latitude/Longitude.
        </p>
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={mapSearchQuery}
            onChange={(e) => setMapSearchQuery(e.target.value)}
            placeholder="Cari daerah atau alamat untuk menggeser peta"
            className="rounded-2xl h-11 pl-10 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
          />
          {mapSearching && (
            <Loader2
              size={14}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-500 animate-spin"
            />
          )}
        </div>
        {/* ✅ Perbaikan: Conditional rendering untuk error map search */}
        {shouldShowMapError ? (
          <p className="text-xs text-yellow-600 mt-1">Minimal 3 karakter untuk mencari lokasi</p>
        ) : mapSearchError && mapSearchQuery.trim().length >= 3 ? (
          <p className="text-xs text-amber-600 mt-1">{mapSearchError}</p>
        ) : null}
      </div>

      {/* Peta -- SELALU muncul (default Bandung) supaya tidak perlu isi
          alamat dulu buat lihat petanya. Latitude/Longitude dipindah ke
          BAWAH peta ini (bukan di atas lagi). */}
      <div className="col-span-2 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {hasValidCoords
              ? "Klik atau geser pin untuk ubah titik lokasi"
              : "Klik atau geser pin di peta untuk pilih lokasi pelanggan"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMapExpanded((v) => !v)}
            className="rounded-xl h-8 text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
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

        <LocationPickerMap
          lat={displayLat}
          lng={displayLng}
          height={mapExpanded ? "420px" : "220px"}
          onChange={(newLat, newLng) => {
            setLatitude(newLat.toFixed(6));
            setLongitude(newLng.toFixed(6));
          }}
        />
      </div>

      {/* ================================================ */}
      {/* LATITUDE / LONGITUDE -- dipindah ke BAWAH peta */}
      {/* ================================================ */}
      <div className="space-y-2">
        <Label
          htmlFor="latitude"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Locate size={13} className="text-purple-500" /> Latitude
        </Label>
        <Input
          id="latitude"
          name="latitude"
          type="number"
          step="any"
          placeholder="Terisi otomatis dari alamat/peta"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
          required
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="longitude"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          <Locate size={13} className="text-purple-500" /> Longitude
        </Label>
        <Input
          id="longitude"
          name="longitude"
          type="number"
          step="any"
          placeholder="Terisi otomatis dari alamat/peta"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          className="rounded-2xl h-12 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
          required
        />
      </div>
    </div>
  );
};