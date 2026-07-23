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
} from "lucide-react";

import { updateSettings } from "@/app/settings/actions";

type Settings = {
  app_name: string;
  app_subtitle: string;
  login_title: string;
  login_subtitle: string;
  login_logo: string | null;
  app_font: string;
  app_font_size: number;
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
  { id: "identitas", label: "Identitas Aplikasi", icon: LayoutDashboard, color: "indigo" },
  { id: "login", label: "Halaman Login", icon: Type, color: "fuchsia" },
  { id: "tipografi", label: "Tipografi", icon: TextCursorInput, color: "emerald" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export default function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const [activeTab, setActiveTab] = useState<TabId>("identitas");
  const [preview, setPreview] = useState<string | null>(initialSettings.login_logo);
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [selectedFont, setSelectedFont] = useState(initialSettings.app_font);
  const [fontSize, setFontSize] = useState(initialSettings.app_font_size);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleSubmit(formData: FormData) {
    if (!fileSelected && !preview) {
      formData.delete("logo");
    }

    startTransition(async () => {
      try {
        await updateSettings(formData);
        toast.success("Pengaturan berhasil disimpan.");
      } catch (err) {
        toast.error("Gagal menyimpan pengaturan. Coba lagi.");
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">

        {/* HEADER BANNER — gradient sudah gelap, tidak perlu diubah */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-500 px-8 py-10 text-center text-white">
          <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles size={14} />
            Pengaturan Tampilan
          </div>

          <h2 className="relative mt-4 text-2xl font-extrabold">
            Sesuaikan Identitas Aplikasi Kamu
          </h2>
          <p className="relative mt-1 text-sm text-indigo-100">
            Ubah logo dan teks yang tampil di dashboard & halaman login
          </p>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b-2 border-slate-100 px-4 dark:border-slate-800">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-4 text-sm font-semibold transition ${
                  active
                    ? tab.color === "indigo"
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : tab.color === "fuchsia"
                      ? "border-fuchsia-600 text-fuchsia-600 dark:text-fuchsia-400"
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

        <form action={handleSubmit} className="px-8 py-8">

          {/* TAB 1: Identitas Aplikasi */}
          <section className={activeTab === "identitas" ? "block" : "hidden"}>
            <div className="rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-800/30">

              <div className="flex flex-col items-center">
                <div className="group relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-indigo-100 to-purple-100 shadow-lg ring-4 ring-indigo-500/10 transition-all duration-300 hover:ring-indigo-500/30 dark:border-slate-900 dark:from-indigo-900/40 dark:to-purple-900/40">
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
                    <ImageIcon className="text-indigo-300 dark:text-indigo-600" size={32} />
                  )}
                </div>

                <label
                  htmlFor="logo-upload"
                  className="mt-4 flex cursor-pointer items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg"
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
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nama Aplikasi
                  </label>
                  <input
                    name="app_name"
                    defaultValue={initialSettings.app_name}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-center transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20 sm:text-left"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Subtitle Aplikasi
                  </label>
                  <input
                    name="app_subtitle"
                    defaultValue={initialSettings.app_subtitle}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-center transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/20 sm:text-left"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* TAB 2: Halaman Login */}
          <section className={activeTab === "login" ? "block" : "hidden"}>
            <div className="space-y-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-800/30">
              <div>
                <label className="mb-1.5 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Type size={14} className="text-fuchsia-500" />
                  Judul
                </label>
                <input
                  name="login_title"
                  defaultValue={initialSettings.login_title}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-center text-sm transition focus:border-fuchsia-500 focus:outline-none focus:ring-4 focus:ring-fuchsia-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-fuchsia-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-center text-sm font-medium text-slate-700 dark:text-slate-300">
                  Subtitle
                </label>
                <textarea
                  name="login_subtitle"
                  defaultValue={initialSettings.login_subtitle}
                  rows={2}
                  className="w-full resize-none rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-center text-sm transition focus:border-fuchsia-500 focus:outline-none focus:ring-4 focus:ring-fuchsia-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-fuchsia-500/20"
                />
              </div>
            </div>
          </section>

          {/* TAB 3: Tipografi */}
          <section className={activeTab === "tipografi" ? "block" : "hidden"}>
            <div className="space-y-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-800/30">

              <div>
                <label className="mb-2.5 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
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
                      className={`rounded-xl border-2 px-3 py-3 text-left transition ${
                        selectedFont === font.value
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{font.label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{font.preview}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2.5 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
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

                <div className="mt-1 flex justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span>Kecil (14px)</span>
                  <span>Sedang (16px)</span>
                  <span>Besar (20px)</span>
                </div>
              </div>

            </div>
          </section>

          {/* ACTION BAR */}
          <div className="mt-8 flex justify-center border-t-2 border-slate-100 pt-7 dark:border-slate-800">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
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