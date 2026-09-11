"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  Globe,
  ImageIcon,
  Loader2,
  Moon,
  Save,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { updateSettings } from "@/app/settings/actions";

type Settings = {
  app_name: string;
  app_subtitle: string;
  login_title: string;
  login_subtitle: string;
  login_logo: string | null;
  login_logo_dark: string | null;
  favicon: string | null;
  app_font: string;
  app_font_size: number;
  footer_text: string;
  primary_color: string;
  timezone: string;
  maintenance_mode: boolean;
  maintenance_message: string;
};

const FONT_OPTIONS = [
  { value: "inter", label: "Inter", preview: "Modern & netral" },
  { value: "jakarta", label: "Plus Jakarta Sans", preview: "Tegas & profesional" },
  { value: "poppins", label: "Poppins", preview: "Bulat & ramah" },
  { value: "nunito", label: "Nunito", preview: "Lembut & rounded" },
  { value: "manrope", label: "Manrope", preview: "Clean & minimal" },
  { value: "outfit", label: "Outfit", preview: "Geometris & modern" },
];

const TIMEZONE_OPTIONS = [
  { value: "Asia/Jakarta", label: "WIB — Asia/Jakarta" },
  { value: "Asia/Makassar", label: "WITA — Asia/Makassar" },
  { value: "Asia/Jayapura", label: "WIT — Asia/Jayapura" },
  { value: "UTC", label: "UTC" },
];

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const FAVICON_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "image/x-icon"];

const APP_NAME_MAX = 40;
const LOGIN_TITLE_MAX = 60;
const SUBTITLE_MAX = 120;
const FOOTER_MAX = 160;
const MAINTENANCE_MSG_MAX = 200;

function FieldRow({
  label,
  description,
  children,
  onReset,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
  onReset?: () => void;
}) {
  return (
    <div className="grid gap-4 border-b border-slate-200 py-7 last:border-b-0 dark:border-slate-800 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-8">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</h3>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="shrink-0 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Reset
            </button>
          )}
        </div>
        <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function CharCounter({ value, max }: { value: string; max: number }) {
  const isNear = value.length >= max * 0.9;
  return (
    <p className={`mt-1.5 text-right text-xs ${isNear ? "text-amber-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`}>
      {value.length}/{max}
    </p>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500";

function checkAspectRatio(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = img.width / img.height;
      URL.revokeObjectURL(url);
      resolve(ratio >= 0.8 && ratio <= 1.2);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(true); // gagal cek, jangan blokir upload
    };
    img.src = url;
  });
}

export default function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  // --- Text fields ---
  const [appName, setAppName] = useState(initialSettings.app_name);
  const [appSubtitle, setAppSubtitle] = useState(initialSettings.app_subtitle);
  const [loginTitle, setLoginTitle] = useState(initialSettings.login_title);
  const [loginSubtitle, setLoginSubtitle] = useState(initialSettings.login_subtitle);
  const [footerText, setFooterText] = useState(initialSettings.footer_text);

  // --- Logo & favicon ---
  const [preview, setPreview] = useState<string | null>(initialSettings.login_logo);
  const [darkPreview, setDarkPreview] = useState<string | null>(initialSettings.login_logo_dark);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(initialSettings.favicon);
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [darkFileSelected, setDarkFileSelected] = useState<File | null>(null);

  // --- Tampilan ---
  const [selectedFont, setSelectedFont] = useState(initialSettings.app_font);
  const [fontSize, setFontSize] = useState(initialSettings.app_font_size);
  const [primaryColor, setPrimaryColor] = useState(initialSettings.primary_color);

  // --- Regional & maintenance ---
  const [timezone, setTimezone] = useState(initialSettings.timezone);
  const [maintenanceMode, setMaintenanceMode] = useState(initialSettings.maintenance_mode);
  const [maintenanceMessage, setMaintenanceMessage] = useState(initialSettings.maintenance_message);

  const [isDirty, setIsDirty] = useState(false);
  const isDirtyRef = useRef(false); // dipakai supaya beforeunload selalu baca nilai terbaru tanpa delay render
  const [isPending, startTransition] = useTransition();

  // --- Custom confirm modal (menggantikan window.confirm) ---
  const [confirmDialog, setConfirmDialog] = useState<{
    messages: string[];
    formData: FormData;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const darkLogoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const markDirty = () => {
    isDirtyRef.current = true;
    setIsDirty(true);
  };

  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("File harus berupa gambar.");
    if (file.size > MAX_FILE_SIZE) return void toast.error("Ukuran gambar maksimal 2MB.");
    const isSquareish = await checkAspectRatio(file);
    if (!isSquareish) toast.warning("Logo sebaiknya mendekati persegi agar tidak terpotong/gepeng.");
    setFileSelected(file);
    setPreview(URL.createObjectURL(file));
    markDirty();
  }

  function handleRemoveLogo() {
    setPreview(null);
    setFileSelected(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    markDirty();
  }

  async function handleDarkLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("File harus berupa gambar.");
    if (file.size > MAX_FILE_SIZE) return void toast.error("Ukuran gambar maksimal 2MB.");
    const isSquareish = await checkAspectRatio(file);
    if (!isSquareish) toast.warning("Logo sebaiknya mendekati persegi agar tidak terpotong/gepeng.");
    setDarkFileSelected(file);
    setDarkPreview(URL.createObjectURL(file));
    markDirty();
  }

  function handleRemoveDarkLogo() {
    setDarkPreview(null);
    setDarkFileSelected(null);
    if (darkLogoInputRef.current) darkLogoInputRef.current.value = "";
    markDirty();
  }

  function handleFaviconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!FAVICON_TYPES.includes(file.type)) return void toast.error("Icon harus berupa PNG, JPG, WEBP, GIF, SVG, atau ICO.");
    if (file.size > MAX_FILE_SIZE) return void toast.error("Ukuran icon maksimal 2MB.");
    setFaviconPreview(URL.createObjectURL(file));
    markDirty();
  }

  function handleRemoveFavicon() {
    setFaviconPreview(null);
    if (faviconInputRef.current) faviconInputRef.current.value = "";
    markDirty();
  }

  function resetSection(fields: Array<keyof Settings>) {
    fields.forEach((field) => {
      switch (field) {
        case "app_name": setAppName(initialSettings.app_name); break;
        case "app_subtitle": setAppSubtitle(initialSettings.app_subtitle); break;
        case "login_title": setLoginTitle(initialSettings.login_title); break;
        case "login_subtitle": setLoginSubtitle(initialSettings.login_subtitle); break;
        case "footer_text": setFooterText(initialSettings.footer_text); break;
        case "app_font": setSelectedFont(initialSettings.app_font); break;
        case "app_font_size": setFontSize(initialSettings.app_font_size); break;
        case "primary_color": setPrimaryColor(initialSettings.primary_color); break;
        case "timezone": setTimezone(initialSettings.timezone); break;
        case "maintenance_mode": setMaintenanceMode(initialSettings.maintenance_mode); break;
        case "maintenance_message": setMaintenanceMessage(initialSettings.maintenance_message); break;
      }
    });
    toast.info("Dikembalikan ke nilai tersimpan terakhir.");
  }

  function handleSubmit(formData: FormData) {
    if (!fileSelected && !preview) formData.delete("logo");
    if (!darkFileSelected && !darkPreview) {
      formData.delete("logo_dark");
      formData.set("remove_logo_dark", "true");
    }
    if (!faviconPreview) {
      formData.delete("favicon");
      formData.set("remove_favicon", "true");
    }

    // checkbox HTML nggak ngirim "false" saat unchecked, jadi kita set manual
    formData.set("maintenance_mode", maintenanceMode ? "true" : "false");

    const messages: string[] = [];

    const majorChange =
      selectedFont !== initialSettings.app_font || primaryColor !== initialSettings.primary_color;
    if (majorChange) {
      messages.push(
        "Kamu mengubah font dan/atau warna utama aplikasi — perubahan ini akan langsung terlihat di seluruh dashboard dan halaman login."
      );
    }

    if (maintenanceMode && !initialSettings.maintenance_mode) {
      messages.push(
        "Kamu akan mengaktifkan maintenance mode — pengguna non-admin tidak akan bisa mengakses aplikasi."
      );
    }

    if (messages.length > 0) {
      setConfirmDialog({ messages, formData });
      return;
    }

    submitSettings(formData);
  }

  function submitSettings(formData: FormData) {
    startTransition(async () => {
      try {
        await updateSettings(formData);
        toast.success("Pengaturan berhasil disimpan.");
        isDirtyRef.current = false; // matikan flag duluan sebelum reload
        setIsDirty(false);
        window.location.reload();
      } catch (error) {
        console.error(error);
        toast.error("Gagal menyimpan pengaturan. Coba lagi.");
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Workspace settings</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Settings</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Kelola identitas, tampilan, dan pengalaman login aplikasi PASSNET.</p>
        </div>
      </header>

      {isDirty && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle size={18} className="shrink-0" />
          <span>Ada perubahan yang belum disimpan. Jangan tutup halaman ini sebelum klik &quot;Simpan perubahan&quot;.</span>
        </div>
      )}

      <div className="my-7 flex flex-col gap-4 rounded-xl border border-indigo-200 bg-indigo-50/70 p-5 dark:border-indigo-500/25 dark:bg-indigo-500/10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-sm font-semibold text-indigo-950 dark:text-indigo-100">Identitas aplikasi terpusat</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-indigo-800/75 dark:text-indigo-200/75">Nama, logo, dan tipografi di sini akan digunakan oleh dashboard dan halaman login agar tetap konsisten.</p>
        </div>
        <span className="shrink-0 rounded-md bg-white/80 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:bg-slate-900/60 dark:text-indigo-300">Admin only</span>
      </div>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <form action={handleSubmit} onChange={markDirty} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* --- Identitas aplikasi --- */}
          <section className="px-5 sm:px-8">
            <div className="border-b border-slate-200 py-6 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Identitas aplikasi</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tentukan nama dan aset utama yang dikenali pengguna.</p>
            </div>

            <FieldRow
              label="Nama aplikasi"
              description="Ditampilkan di navigasi, judul browser, dan area branding utama."
              onReset={() => resetSection(["app_name"])}
            >
              <input
                name="app_name"
                required
                maxLength={APP_NAME_MAX}
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className={inputClass}
              />
              <CharCounter value={appName} max={APP_NAME_MAX} />
            </FieldRow>

            <FieldRow
              label="Subtitle aplikasi"
              description="Deskripsi singkat yang muncul bersama nama aplikasi di halaman login."
              onReset={() => resetSection(["app_subtitle"])}
            >
              <input
                name="app_subtitle"
                maxLength={SUBTITLE_MAX}
                value={appSubtitle}
                onChange={(e) => setAppSubtitle(e.target.value)}
                className={inputClass}
              />
              <CharCounter value={appSubtitle} max={SUBTITLE_MAX} />
            </FieldRow>

            <FieldRow label="Logo login (light mode)" description="Logo utama pada halaman login. Gunakan gambar persegi agar tampil proporsional.">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                  {preview ? (
                    <Image src={preview} alt="Preview logo login" fill className="object-contain p-2" unoptimized />
                  ) : (
                    <ImageIcon size={25} className="text-slate-400" />
                  )}
                  {preview && (
                    <button type="button" onClick={handleRemoveLogo} className="absolute right-1 top-1 rounded-md bg-rose-500 p-1 text-white" title="Hapus logo">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div>
                  <label htmlFor="logo-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300">
                    <Upload size={15} /> Pilih logo
                  </label>
                  <input ref={fileInputRef} id="logo-upload" type="file" name="logo" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">PNG atau JPG, maksimal 2MB. Idealnya persegi.</p>
                </div>
              </div>
            </FieldRow>

            <FieldRow
              label="Logo login (dark mode)"
              description="Opsional. Dipakai otomatis saat pengguna memakai tema gelap. Kalau kosong, logo light mode akan tetap dipakai."
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
                  {darkPreview ? (
                    <Image src={darkPreview} alt="Preview logo login dark" fill className="object-contain p-2" unoptimized />
                  ) : (
                    <Moon size={22} className="text-slate-500" />
                  )}
                  {darkPreview && (
                    <button type="button" onClick={handleRemoveDarkLogo} className="absolute right-1 top-1 rounded-md bg-rose-500 p-1 text-white" title="Hapus logo dark mode">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div>
                  <label htmlFor="logo-dark-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300">
                    <Upload size={15} /> Pilih logo dark
                  </label>
                  <input ref={darkLogoInputRef} id="logo-dark-upload" type="file" name="logo_dark" accept="image/*" onChange={handleDarkLogoChange} className="hidden" />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">PNG atau JPG, maksimal 2MB.</p>
                </div>
              </div>
            </FieldRow>

            <FieldRow label="Icon tab browser" description="Icon kecil yang muncul pada tab browser dan shortcut aplikasi.">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                  {faviconPreview ? (
                    <Image src={faviconPreview} alt="Preview icon tab" fill className="object-contain p-2" unoptimized />
                  ) : (
                    <Globe size={22} className="text-slate-400" />
                  )}
                  {faviconPreview && (
                    <button type="button" onClick={handleRemoveFavicon} className="absolute right-0 top-0 rounded-bl-md bg-rose-500 p-1 text-white" title="Hapus icon tab">
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
                <div>
                  <label htmlFor="favicon-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300">
                    <Upload size={15} /> Ganti icon
                  </label>
                  <input ref={faviconInputRef} id="favicon-upload" type="file" name="favicon" accept=".png,.jpg,.jpeg,.webp,.gif,.svg,.ico,image/*" onChange={handleFaviconChange} className="hidden" />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">PNG, ICO, WEBP, SVG, atau GIF, maksimal 2MB.</p>
                </div>
              </div>
            </FieldRow>
          </section>

          {/* --- Tampilan --- */}
          <section className="border-t border-slate-200 px-5 sm:px-8 dark:border-slate-800">
            <div className="border-b border-slate-200 py-6 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Tampilan</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sesuaikan karakter visual dashboard untuk tim operasional.</p>
            </div>

            <FieldRow
              label="Jenis font"
              description="Font ini diterapkan ke seluruh area aplikasi setelah pengaturan disimpan."
              onReset={() => resetSection(["app_font"])}
            >
              <input type="hidden" name="app_font" value={selectedFont} />
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.value}
                    type="button"
                    onClick={() => { setSelectedFont(font.value); markDirty(); }}
                    style={{ fontFamily: `var(--font-${font.value})` }}
                    className={`rounded-lg border px-3 py-3 text-left transition ${
                      selectedFont === font.value
                        ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 dark:border-indigo-400 dark:bg-indigo-500/10"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">{font.label}</span>
                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{font.preview}</span>
                  </button>
                ))}
              </div>
            </FieldRow>

            <FieldRow
              label="Ukuran teks"
              description="Atur skala teks dasar agar nyaman dibaca pada monitor dan laptop tim."
              onReset={() => resetSection(["app_font_size"])}
            >
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-950">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Skala dasar</span>
                  <strong className="text-slate-900 dark:text-slate-100">{fontSize}px</strong>
                </div>
                <input
                  type="range"
                  name="app_font_size"
                  min={14}
                  max={20}
                  step={1}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="mt-4 w-full accent-indigo-600"
                />
                <div className="mt-2 flex justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span>14px</span><span>16px</span><span>20px</span>
                </div>
              </div>
            </FieldRow>

            <FieldRow
              label="Warna utama (accent)"
              description="Dipakai untuk tombol, link, dan aksen utama di dashboard & halaman login."
              onReset={() => resetSection(["primary_color"])}
            >
              <input type="hidden" name="primary_color" value={primaryColor} />
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => { setPrimaryColor(e.target.value); markDirty(); }}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-950"
                />
                <input
                  value={primaryColor}
                  onChange={(e) => { setPrimaryColor(e.target.value); markDirty(); }}
                  className={`${inputClass} font-mono uppercase`}
                  maxLength={7}
                  placeholder="#4F46E5"
                />
              </div>
            </FieldRow>
          </section>

          {/* --- Halaman login --- */}
          <section className="border-t border-slate-200 px-5 sm:px-8 dark:border-slate-800">
            <div className="border-b border-slate-200 py-6 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Halaman login</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Atur pesan yang menyambut pengguna sebelum mereka masuk ke sistem.</p>
            </div>

            <FieldRow
              label="Judul login"
              description="Headline utama yang dilihat pengguna pada kartu login."
              onReset={() => resetSection(["login_title"])}
            >
              <div className="relative">
                <Type size={16} className="pointer-events-none absolute left-3.5 top-3 text-slate-400" />
                <input
                  name="login_title"
                  required
                  maxLength={LOGIN_TITLE_MAX}
                  value={loginTitle}
                  onChange={(e) => setLoginTitle(e.target.value)}
                  className={`${inputClass} pl-10`}
                />
              </div>
              <CharCounter value={loginTitle} max={LOGIN_TITLE_MAX} />
            </FieldRow>

            <FieldRow
              label="Subtitle login"
              description="Penjelasan singkat di bawah judul login untuk memberi konteks kepada pengguna."
              onReset={() => resetSection(["login_subtitle"])}
            >
              <textarea
                name="login_subtitle"
                maxLength={SUBTITLE_MAX}
                value={loginSubtitle}
                onChange={(e) => setLoginSubtitle(e.target.value)}
                rows={3}
                className={`${inputClass} resize-y`}
              />
              <CharCounter value={loginSubtitle} max={SUBTITLE_MAX} />
            </FieldRow>
          </section>

          {/* --- Regional --- */}
          <section className="border-t border-slate-200 px-5 sm:px-8 dark:border-slate-800">
            <div className="border-b border-slate-200 py-6 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Regional</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Zona waktu yang dipakai untuk jam dan tanggal di seluruh aplikasi.</p>
            </div>
            <FieldRow
              label="Zona waktu"
              description="Menentukan format jam & tanggal yang tampil di navbar dan log aktivitas."
              onReset={() => resetSection(["timezone"])}
            >
              <select
                name="timezone"
                value={timezone}
                onChange={(e) => { setTimezone(e.target.value); markDirty(); }}
                className={inputClass}
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </FieldRow>
          </section>

          {/* --- Maintenance mode --- */}
          <section className="border-t border-slate-200 px-5 sm:px-8 dark:border-slate-800">
            <div className="border-b border-slate-200 py-6 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Maintenance mode</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Kalau aktif, pengguna non-admin akan melihat halaman pemeliharaan.</p>
            </div>
            <FieldRow
              label="Aktifkan maintenance mode"
              description="Gunakan saat sedang melakukan perubahan besar atau migrasi data."
              onReset={() => resetSection(["maintenance_mode", "maintenance_message"])}
            >
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => { setMaintenanceMode(e.target.checked); markDirty(); }}
                  className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {maintenanceMode ? "Aktif — pengguna biasa tidak bisa mengakses aplikasi" : "Nonaktif"}
                </span>
              </label>

              {maintenanceMode && (
                <div className="mt-4">
                  <textarea
                    name="maintenance_message"
                    maxLength={MAINTENANCE_MSG_MAX}
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    rows={2}
                    placeholder="Pesan yang dilihat pengguna saat maintenance"
                    className={`${inputClass} resize-y`}
                  />
                  <CharCounter value={maintenanceMessage} max={MAINTENANCE_MSG_MAX} />
                </div>
              )}
            </FieldRow>
          </section>

          {/* --- Footer --- */}
          <section className="border-t border-slate-200 px-5 sm:px-8 dark:border-slate-800">
            <div className="border-b border-slate-200 py-6 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Footer</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Satu teks footer untuk login dan area dashboard aplikasi.</p>
            </div>
            <FieldRow
              label="Teks footer"
              description="Teks ini tampil di bagian bawah halaman login dan dashboard."
              onReset={() => resetSection(["footer_text"])}
            >
              <textarea
                name="footer_text"
                maxLength={FOOTER_MAX}
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                rows={3}
                placeholder="© 2026 PASSNET. All rights reserved."
                className={`${inputClass} resize-y`}
              />
              <CharCounter value={footerText} max={FOOTER_MAX} />
            </FieldRow>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-950/60 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="text-xs text-slate-500 dark:text-slate-400">Perubahan akan diterapkan setelah disimpan.</p>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (<><Loader2 size={16} className="animate-spin" /> Menyimpan...</>) : (<><Save size={16} /> Simpan perubahan</>)}
            </button>
          </div>
        </form>

        {/* --- Live preview --- */}
        <aside className="h-fit lg:sticky lg:top-6">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Live preview</h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Perkiraan tampilan halaman login setelah disimpan.</p>
            </div>
            <div
              className="flex flex-col items-center gap-4 p-8 text-center"
              style={{ fontFamily: `var(--font-${selectedFont})`, fontSize: `${fontSize}px` }}
            >
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                {preview ? (
                  <Image src={preview} alt="Preview logo" fill className="object-contain p-2" unoptimized />
                ) : (
                  <ImageIcon size={22} className="text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: primaryColor }}>
                  {appName || "Nama aplikasi"}
                </p>
                <h4 className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                  {loginTitle || "Judul login"}
                </h4>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {loginSubtitle || "Subtitle login akan muncul di sini"}
                </p>
              </div>
              <button
                type="button"
                disabled
                className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                Masuk
              </button>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {footerText || "© 2026 PASSNET. All rights reserved."}
              </p>
            </div>
            <div className="border-t border-slate-200 bg-slate-900 dark:border-slate-800">
              <div className="flex items-center gap-2 px-5 py-3">
                <Moon size={13} className="text-slate-400" />
                <span className="text-xs text-slate-400">Preview dark mode logo</span>
              </div>
              <div className="flex justify-center pb-6">
                <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                  {darkPreview ? (
                    <Image src={darkPreview} alt="Preview logo dark" fill className="object-contain p-2" unoptimized />
                  ) : preview ? (
                    <Image src={preview} alt="Fallback ke logo light" fill className="object-contain p-2 opacity-70" unoptimized />
                  ) : (
                    <ImageIcon size={20} className="text-slate-600" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {maintenanceMode && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <p className="font-semibold">Maintenance mode aktif</p>
              <p className="mt-1 leading-5">{maintenanceMessage}</p>
            </div>
          )}
        </aside>
      </div>

      {/* --- Modal konfirmasi custom (pengganti window.confirm) --- */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/15">
                <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Konfirmasi perubahan
                </h3>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {confirmDialog.messages.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const fd = confirmDialog.formData;
                  setConfirmDialog(null);
                  submitSettings(fd);
                }}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Ya, lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}