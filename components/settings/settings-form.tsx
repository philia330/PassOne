"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  ImageIcon,
  Loader2,
  Save,
  Trash2,
  Type,
  Sparkles,
  Upload,
  TextCursorInput,
  LayoutDashboard,
  LayoutTemplate,
  Globe,
} from "lucide-react";

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
  { value: "inter", label: "Inter", preview: "Modern & Netral" },
  { value: "jakarta", label: "Plus Jakarta Sans", preview: "Tegas & Profesional" },
  { value: "poppins", label: "Poppins", preview: "Bulat & Ramah" },
  { value: "nunito", label: "Nunito", preview: "Lembut & Rounded" },
  { value: "manrope", label: "Manrope", preview: "Clean & Minimal" },
  { value: "outfit", label: "Outfit", preview: "Geometris & Modern" },
];

const TABS = [
  { id: "identitas", label: "Identitas", icon: LayoutDashboard, color: "indigo" },
  { id: "login", label: "Login", icon: Type, color: "fuchsia" },
  { id: "tipografi", label: "Font", icon: TextCursorInput, color: "emerald" },
  { id: "footer", label: "Footer", icon: LayoutTemplate, color: "amber" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export default function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const [activeTab, setActiveTab] = useState<TabId>("identitas");
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

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ukuran gambar maksimal 2MB.");
      return;
    }

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

    if (!["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "image/x-icon"].includes(file.type)) {
      toast.error("Icon harus berupa PNG, JPG, WEBP, GIF, SVG, atau ICO.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ukuran icon maksimal 2MB.");
      return;
    }

    setFaviconPreview(URL.createObjectURL(file));
  }

  function handleRemoveFavicon() {
    setFaviconPreview(null);
    if (faviconInputRef.current) faviconInputRef.current.value = "";
  }

  function handleSubmit(formData: FormData) {
    if (!fileSelected && !preview) {
      formData.delete("logo");
    }

    if (!faviconPreview) {
      formData.delete("favicon");
      formData.set("remove_favicon", "true");
    }

    startTransition(async () => {
      try {
        await updateSettings(formData);
        toast.success("Pengaturan berhasil disimpan.");
        window.location.reload();
      } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan pengaturan. Coba lagi.");
    }
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">

        {/* HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-500 px-6 py-8 text-center sm:px-8 sm:py-10 text-white">
          <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles size={14} />
            Pengaturan Tampilan
          </div>

          <h2 className="relative mt-4 text-xl font-bold sm:text-2xl">
            Sesuaikan Identitas Aplikasi
          </h2>
          <p className="relative mt-1 text-sm text-indigo-100">
            Ubah logo, teks, dan tampilan aplikasi
          </p>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3.5 text-sm font-semibold transition hover:scale-105 active:scale-95 ${
                  active
                    ? tab.color === "indigo"
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : tab.color === "fuchsia"
                      ? "border-fuchsia-600 text-fuchsia-600 dark:text-fuchsia-400"
                      : tab.color === "amber"
                      ? "border-amber-600 text-amber-600 dark:text-amber-400"
                      : "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <form action={handleSubmit} className="p-6 sm:p-8">

          {/* TAB 1: Identitas Aplikasi */}
          <section className={activeTab === "identitas" ? "block" : "hidden"}>
            <div className="space-y-6">
              {/* Logo Section */}
              <div className="flex flex-col items-center">
                <div className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-indigo-100 to-purple-100 shadow-lg ring-4 ring-indigo-500/10 transition-all duration-300 hover:ring-indigo-500/30 dark:border-slate-800 dark:from-indigo-900/40 dark:to-purple-900/40 sm:h-28 sm:w-28">
                  {preview ? (
                    <>
                      <Image
                        src={preview}
                        alt="Logo preview"
                        fill
                        className="object-contain p-3"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -right-1 -top-1 rounded-full bg-red-500 p-1.5 text-white shadow-md transition hover:scale-110 hover:bg-red-600"
                        title="Hapus logo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="text-indigo-300 dark:text-indigo-600" size={28} />
                  )}
                </div>

                <label
                  htmlFor="logo-upload"
                  className="mt-4 flex cursor-pointer items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:-translate-y-0.5 hover:scale-105 hover:bg-indigo-700 hover:shadow-lg"
                >
                  <Upload size={15} />
                  Pilih Logo
                </label>
                <input
                  ref={fileInputRef}
                  id="logo-upload"
                  type="file"
                  name="logo"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                  PNG/JPG, rasio 1:1, maksimal 2MB
                </p>

                <div className="mt-6 flex flex-col items-center border-t border-slate-100 pt-6 dark:border-slate-800">
                  <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                    {faviconPreview ? (
                      <>
                        <Image src={faviconPreview} alt="Preview icon tab" fill className="object-contain p-2" unoptimized />
                        <button type="button" onClick={handleRemoveFavicon} className="absolute right-0 top-0 rounded-bl-md bg-red-500 p-1 text-white" title="Hapus icon tab">
                          <Trash2 size={10} />
                        </button>
                      </>
                    ) : (
                      <Globe size={22} className="text-slate-400" />
                    )}
                  </div>
                  <label htmlFor="favicon-upload" className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-300">
                    <Upload size={13} />
                    Ganti Icon Tab
                  </label>
                  <input ref={faviconInputRef} id="favicon-upload" type="file" name="favicon" accept=".png,.jpg,.jpeg,.webp,.ico,image/*" onChange={handleFaviconChange} className="hidden" />
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">PNG/ICO/WEBP/SVG, maksimal 2MB</p>
                </div>
              </div>

              {/* Text Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nama Aplikasi
                  </label>
                  <input
                    name="app_name"
                    defaultValue={initialSettings.app_name}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Subtitle Aplikasi
                  </label>
                  <input
                    name="app_subtitle"
                    defaultValue={initialSettings.app_subtitle}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* TAB 2: Halaman Login */}
          <section className={activeTab === "login" ? "block" : "hidden"}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Type size={14} className="text-fuchsia-500" />
                  Judul Login
                </label>
                <input
                  name="login_title"
                  defaultValue={initialSettings.login_title}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-fuchsia-500 dark:focus:ring-fuchsia-500/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Subtitle Login
                </label>
                <textarea
                  name="login_subtitle"
                  defaultValue={initialSettings.login_subtitle}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-fuchsia-500 dark:focus:ring-fuchsia-500/20"
                />
              </div>
            </div>
          </section>

          {/* TAB 3: Tipografi */}
          <section className={activeTab === "tipografi" ? "block" : "hidden"}>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <TextCursorInput size={14} className="text-emerald-500" />
                  Jenis Font
                </label>

                <input type="hidden" name="app_font" value={selectedFont} />

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {FONT_OPTIONS.map((font) => (
                    <button
                      key={font.value}
                      type="button"
                      onClick={() => setSelectedFont(font.value)}
                      style={{ fontFamily: `var(--font-${font.value})` }}
                      className={`rounded-xl border px-3 py-3 text-left transition hover:scale-105 active:scale-95 ${
                        selectedFont === font.value
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{font.label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{font.preview}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Ukuran Teks — <span className="font-bold text-emerald-600 dark:text-emerald-400">{fontSize}px</span>
                </label>

                <input
                  type="range"
                  name="app_font_size"
                  min={14}
                  max={20}
                  step={1}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />

                <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span>Kecil (14px)</span>
                  <span>Sedang (16px)</span>
                  <span>Besar (20px)</span>
                </div>
              </div>
            </div>
          </section>

          {/* TAB 4: Footer */}
          <section className={activeTab === "footer" ? "block" : "hidden"}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <LayoutTemplate size={14} className="text-amber-500" />
                  Teks Footer
                </label>
                <textarea
                  name="footer_text"
                  defaultValue={initialSettings.footer_text}
                  rows={3}
                  placeholder="© 2024 PASSNET. All rights reserved."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-amber-500 dark:focus:ring-amber-500/20"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Teks yang akan ditampilkan di bagian bawah halaman.
                </p>
              </div>

              {/* Preview */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="mb-2 text-xs font-medium text-slate-400 dark:text-slate-500">Preview:</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {initialSettings.footer_text || "© 2026 PASSNET. All rights reserved."}
                </p>
              </div>
            </div>
          </section>

          {/* ACTION BAR */}
          <div className="mt-8 flex justify-center border-t border-slate-100 pt-6 dark:border-slate-800">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:scale-100"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Simpan Pengaturan
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}