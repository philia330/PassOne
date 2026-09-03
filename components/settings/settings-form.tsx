"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Check, Globe, ImageIcon, Loader2, Save, Trash2, Type, Upload } from "lucide-react";
import { toast } from "sonner";

import { updateSettings } from "@/app/settings/actions";

type Settings = {
  app_name: string;
  app_subtitle: string;
  login_title: string;
  login_subtitle: string;
  login_logo: string | null;
  favicon: string | null;
  app_font: string;
  app_font_size: number;
  footer_text: string;
};

const FONT_OPTIONS = [
  { value: "inter", label: "Inter", preview: "Modern & netral" },
  { value: "jakarta", label: "Plus Jakarta Sans", preview: "Tegas & profesional" },
  { value: "poppins", label: "Poppins", preview: "Bulat & ramah" },
  { value: "nunito", label: "Nunito", preview: "Lembut & rounded" },
  { value: "manrope", label: "Manrope", preview: "Clean & minimal" },
  { value: "outfit", label: "Outfit", preview: "Geometris & modern" },
];

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const FAVICON_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "image/x-icon"];

function FieldRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 border-b border-slate-200 py-7 last:border-b-0 dark:border-slate-800 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-8">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</h3>
        <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500";

export default function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const [preview, setPreview] = useState<string | null>(initialSettings.login_logo);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(initialSettings.favicon);
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [selectedFont, setSelectedFont] = useState(initialSettings.app_font);
  const [fontSize, setFontSize] = useState(initialSettings.app_font_size);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("File harus berupa gambar.");
    if (file.size > MAX_FILE_SIZE) return void toast.error("Ukuran gambar maksimal 2MB.");
    setFileSelected(file);
    setPreview(URL.createObjectURL(file));
  }

  function handleRemoveLogo() {
    setPreview(null);
    setFileSelected(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFaviconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!FAVICON_TYPES.includes(file.type)) return void toast.error("Icon harus berupa PNG, JPG, WEBP, GIF, SVG, atau ICO.");
    if (file.size > MAX_FILE_SIZE) return void toast.error("Ukuran icon maksimal 2MB.");
    setFaviconPreview(URL.createObjectURL(file));
  }

  function handleRemoveFavicon() {
    setFaviconPreview(null);
    if (faviconInputRef.current) faviconInputRef.current.value = "";
  }

  function handleSubmit(formData: FormData) {
    if (!fileSelected && !preview) formData.delete("logo");
    if (!faviconPreview) {
      formData.delete("favicon");
      formData.set("remove_favicon", "true");
    }

    startTransition(async () => {
      try {
        await updateSettings(formData);
        toast.success("Pengaturan berhasil disimpan.");
        window.location.reload();
      } catch (error) {
        console.error(error);
        toast.error("Gagal menyimpan pengaturan. Coba lagi.");
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Workspace settings</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Settings</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Kelola identitas, tampilan, dan pengalaman login aplikasi PASSNET.</p>
        </div>
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:flex">
          <Check size={16} className="text-emerald-500" /> Perubahan tersimpan di seluruh aplikasi
        </div>
      </header>

      <div className="my-7 flex flex-col gap-4 rounded-xl border border-indigo-200 bg-indigo-50/70 p-5 dark:border-indigo-500/25 dark:bg-indigo-500/10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-sm font-semibold text-indigo-950 dark:text-indigo-100">Identitas aplikasi terpusat</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-indigo-800/75 dark:text-indigo-200/75">Nama, logo, dan tipografi di sini akan digunakan oleh dashboard dan halaman login agar tetap konsisten.</p>
        </div>
        <span className="shrink-0 rounded-md bg-white/80 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:bg-slate-900/60 dark:text-indigo-300">Admin only</span>
      </div>

      <form action={handleSubmit} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <section className="px-5 sm:px-8">
          <div className="border-b border-slate-200 py-6 dark:border-slate-800"><h2 className="text-lg font-semibold text-slate-950 dark:text-white">Identitas aplikasi</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tentukan nama dan aset utama yang dikenali pengguna.</p></div>
          <FieldRow label="Nama aplikasi" description="Ditampilkan di navigasi, judul browser, dan area branding utama."><input name="app_name" defaultValue={initialSettings.app_name} className={inputClass} /></FieldRow>
          <FieldRow label="Subtitle aplikasi" description="Deskripsi singkat yang muncul bersama nama aplikasi di halaman login."><input name="app_subtitle" defaultValue={initialSettings.app_subtitle} className={inputClass} /></FieldRow>
          <FieldRow label="Logo login" description="Logo utama pada halaman login. Gunakan gambar persegi agar tampil proporsional.">
            <div className="flex flex-wrap items-center gap-4"><div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">{preview ? <Image src={preview} alt="Preview logo login" fill className="object-contain p-2" unoptimized /> : <ImageIcon size={25} className="text-slate-400" />}{preview && <button type="button" onClick={handleRemoveLogo} className="absolute right-1 top-1 rounded-md bg-rose-500 p-1 text-white" title="Hapus logo"><Trash2 size={12} /></button>}</div><div><label htmlFor="logo-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300"><Upload size={15} /> Pilih logo</label><input ref={fileInputRef} id="logo-upload" type="file" name="logo" accept="image/*" onChange={handleFileChange} className="hidden" /><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">PNG atau JPG, maksimal 2MB.</p></div></div>
          </FieldRow>
          <FieldRow label="Icon tab browser" description="Icon kecil yang muncul pada tab browser dan shortcut aplikasi.">
            <div className="flex flex-wrap items-center gap-4"><div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">{faviconPreview ? <Image src={faviconPreview} alt="Preview icon tab" fill className="object-contain p-2" unoptimized /> : <Globe size={22} className="text-slate-400" />}{faviconPreview && <button type="button" onClick={handleRemoveFavicon} className="absolute right-0 top-0 rounded-bl-md bg-rose-500 p-1 text-white" title="Hapus icon tab"><Trash2 size={10} /></button>}</div><div><label htmlFor="favicon-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300"><Upload size={15} /> Ganti icon</label><input ref={faviconInputRef} id="favicon-upload" type="file" name="favicon" accept=".png,.jpg,.jpeg,.webp,.gif,.svg,.ico,image/*" onChange={handleFaviconChange} className="hidden" /><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">PNG, ICO, WEBP, SVG, atau GIF, maksimal 2MB.</p></div></div>
          </FieldRow>
        </section>

        <section className="border-t border-slate-200 px-5 sm:px-8 dark:border-slate-800"><div className="border-b border-slate-200 py-6 dark:border-slate-800"><h2 className="text-lg font-semibold text-slate-950 dark:text-white">Tampilan</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sesuaikan karakter visual dashboard untuk tim operasional.</p></div>
          <FieldRow label="Jenis font" description="Font ini diterapkan ke seluruh area aplikasi setelah pengaturan disimpan."><input type="hidden" name="app_font" value={selectedFont} /><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{FONT_OPTIONS.map((font) => <button key={font.value} type="button" onClick={() => setSelectedFont(font.value)} style={{ fontFamily: `var(--font-${font.value})` }} className={`rounded-lg border px-3 py-3 text-left transition ${selectedFont === font.value ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 dark:border-indigo-400 dark:bg-indigo-500/10" : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600"}`}><span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">{font.label}</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{font.preview}</span></button>)}</div></FieldRow>
          <FieldRow label="Ukuran teks" description="Atur skala teks dasar agar nyaman dibaca pada monitor dan laptop tim."><div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-950"><div className="flex items-center justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">Skala dasar</span><strong className="text-slate-900 dark:text-slate-100">{fontSize}px</strong></div><input type="range" name="app_font_size" min={14} max={20} step={1} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="mt-4 w-full accent-indigo-600" /><div className="mt-2 flex justify-between text-xs text-slate-400 dark:text-slate-500"><span>14px</span><span>16px</span><span>20px</span></div></div></FieldRow>
        </section>

        <section className="border-t border-slate-200 px-5 sm:px-8 dark:border-slate-800"><div className="border-b border-slate-200 py-6 dark:border-slate-800"><h2 className="text-lg font-semibold text-slate-950 dark:text-white">Halaman login</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Atur pesan yang menyambut pengguna sebelum mereka masuk ke sistem.</p></div><FieldRow label="Judul login" description="Headline utama yang dilihat pengguna pada kartu login."><div className="relative"><Type size={16} className="pointer-events-none absolute left-3.5 top-3 text-slate-400" /><input name="login_title" defaultValue={initialSettings.login_title} className={`${inputClass} pl-10`} /></div></FieldRow><FieldRow label="Subtitle login" description="Penjelasan singkat di bawah judul login untuk memberi konteks kepada pengguna."><textarea name="login_subtitle" defaultValue={initialSettings.login_subtitle} rows={3} className={`${inputClass} resize-y`} /></FieldRow></section>

        <section className="border-t border-slate-200 px-5 sm:px-8 dark:border-slate-800"><div className="border-b border-slate-200 py-6 dark:border-slate-800"><h2 className="text-lg font-semibold text-slate-950 dark:text-white">Footer</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Satu teks footer untuk login dan area dashboard aplikasi.</p></div><FieldRow label="Teks footer" description="Teks ini tampil di bagian bawah halaman login dan dashboard."><textarea name="footer_text" defaultValue={initialSettings.footer_text} rows={3} placeholder="© 2026 PASSNET. All rights reserved." className={`${inputClass} resize-y`} /></FieldRow></section>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-950/60 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p className="text-xs text-slate-500 dark:text-slate-400">Perubahan akan diterapkan setelah disimpan.</p><button type="submit" disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{isPending ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={16} /> Simpan perubahan</>}</button></div>
      </form>
    </div>
  );
}
