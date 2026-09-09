"use client";

import dynamic from "next/dynamic";
import React, { useState } from "react";
import { Eye, MapPin, User, Phone, Package, Users, Calendar, Hash, FileText, CreditCard, Briefcase, Clock, CheckCircle, ExternalLink, Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { FabData } from "@/types/fab";

const LocationPickerMap = dynamic(() => import("@/components/shared/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[160px] w-full rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400">
      Memuat peta...
    </div>
  ),
});

interface FabViewDialogProps {
  fab: FabData;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Card-style info item for 2-column grid
function InfoCard({ icon: Icon, label, value, iconBg = "bg-purple-100 dark:bg-purple-500/20", iconColor = "text-purple-600 dark:text-purple-400" }: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50">
      <div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl", iconBg, iconColor)}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{value || "-"}</p>
      </div>
    </div>
  );
}

// Full-width info item
function InfoCardFull({ icon: Icon, label, value, iconBg = "bg-sky-100 dark:bg-sky-500/20", iconColor = "text-sky-600 dark:text-sky-400" }: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50">
      <div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl", iconBg, iconColor)}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{value || "-"}</p>
      </div>
    </div>
  );
}

function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{children}</span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600" />
    </div>
  );
}

export function FabViewDialog({ fab, children, open: controlledOpen, onOpenChange }: FabViewDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  const lat = Number(fab.latitude);
  const lng = Number(fab.longitude);
  const hasValidCoords = !Number.isNaN(lat) && !Number.isNaN(lng);

  // Link Google Maps: pakai koordinat kalau ada, kalau nggak fallback ke
  // pencarian berdasarkan teks alamat.
  const googleMapsUrl = hasValidCoords
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : fab.alamat
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fab.alamat)}`
      : null;

  const formatDateLong = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleClick = () => {
    setIsOpen(true);
  };

  const handleDownloadFoto = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!fab.foto) return;

    setIsDownloading(true);
    try {
      const response = await fetch(fab.foto);
      if (!response.ok) {
        throw new Error("Gagal mengambil gambar");
      }

      const blob = await response.blob();

      // Tentukan ekstensi file dari content-type, fallback ke .jpg
      const contentType = response.headers.get("Content-Type") ?? "";
      const extMatch = contentType.match(/image\/(\w+)/);
      const ext = extMatch ? extMatch[1].replace("jpeg", "jpg") : "jpg";

      const safeName = fab.nama_pelanggan
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "");

      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlBlob;
      link.download = `Foto_FAB_${safeName || "pelanggan"}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);

      toast.success("Berhasil mengunduh foto");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Terjadi kesalahan saat mengunduh foto");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children ? (
        <div onDoubleClick={handleClick} className="contents">
          {children}
        </div>
      ) : (
        <DialogTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Eye className="h-4 w-4 text-slate-500" />
            <span>Lihat Detail</span>
          </button>
        </DialogTrigger>
      )}

      <DialogContent
        className="
          flex h-full max-h-[100dvh] w-full max-w-full flex-col
          overflow-hidden rounded-none p-0
          sm:h-auto sm:max-h-[90vh] sm:max-w-[700px] sm:rounded-3xl
        "
      >
        <DialogHeader className="flex-shrink-0 px-4 pt-4 sm:px-6 sm:pt-6 pb-2">
          <DialogTitle className="flex items-start gap-3 text-base sm:text-lg">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/30">
              <FileText size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate font-bold text-slate-900 dark:text-slate-100 text-lg">
                {fab.nama_pelanggan}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-medium text-slate-400">
                  {fab.kode_fab}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-400">
                  {fab.area?.nama_area ?? "Area belum dipilih"}
                </span>
              </div>
            </div>
            {/* mr-8: geser badge ke kiri supaya nggak numpuk sama tombol X
                (close button) yang posisinya absolute di pojok kanan-atas
                dialog. */}
            <Badge
              variant="secondary"
              className={cn(
                "shrink-0 mr-8 rounded-xl px-3 py-1.5 text-xs font-bold",
                fab.status === "AKTIF"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                  : "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400"
              )}
            >
              <span className="flex items-center gap-1.5">
                {fab.status === "AKTIF" ? <CheckCircle size={12} /> : <Clock size={12} />}
                {fab.status === "AKTIF" ? "Aktif" : "Open"}
              </span>
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/*
          Wrapper scroll ini SENGAJA dibuat full-width tanpa padding
          horizontal, supaya scrollbar-nya nempel pas di tepi/border kanan
          dialog (bukan ngambang di tengah karena kepotong padding parent).
          Padding kiri-kanan konten dipindah ke div pembungkus di dalamnya.
        */}
        <div
          className="
            min-h-0 flex-1 overflow-y-auto overflow-x-hidden
            scroll-smooth pt-1.5
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-button]:hidden
            [&::-webkit-scrollbar-button]:h-0
            [&::-webkit-scrollbar-button]:w-0
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-track]:my-1
            [&::-webkit-scrollbar-corner]:bg-transparent
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-slate-300
            [&::-webkit-scrollbar-thumb]:border-2
            [&::-webkit-scrollbar-thumb]:border-solid
            [&::-webkit-scrollbar-thumb]:border-transparent
            [&::-webkit-scrollbar-thumb]:bg-clip-padding
            hover:[&::-webkit-scrollbar-thumb]:bg-purple-400
            dark:[&::-webkit-scrollbar-thumb]:bg-slate-700
            dark:hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/70
            [&::-webkit-scrollbar-thumb]:transition-colors
          "
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgb(203 213 225) transparent" }}
        >
        <div className="px-4 sm:px-6 py-3 space-y-4">
          {/* Foto Lokasi */}
          {fab.foto && (
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src={fab.foto}
                alt={`Foto ${fab.nama_pelanggan}`}
                className="h-44 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Tombol Download */}
              <button
                type="button"
                onClick={handleDownloadFoto}
                disabled={isDownloading}
                title="Download foto"
                className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDownloading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
              </button>

              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <div className="text-white">
                  <p className="text-xs font-semibold opacity-90">Foto Lokasi</p>
                  <p className="text-[10px] opacity-70">Pelanggan</p>
                </div>
                {hasValidCoords && (
                  <span className="rounded-lg bg-black/30 px-2 py-1 text-[10px] font-mono text-white/90 backdrop-blur-sm">
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Info Utama - 2 Kolom */}
          <div className="space-y-2">
            <SectionDivider>Data Pelanggan</SectionDivider>
            <div className="grid grid-cols-2 gap-2">
              <InfoCard icon={User} label="Nama" value={fab.nama_pelanggan} />
              <InfoCard icon={Phone} label="No. HP" value={fab.no_hp} iconBg="bg-green-100 dark:bg-green-500/20" iconColor="text-green-600 dark:text-green-400" />
              <InfoCard icon={Hash} label="NIK" value={fab.nik} iconBg="bg-amber-100 dark:bg-amber-500/20" iconColor="text-amber-600 dark:text-amber-400" />
              <InfoCard icon={Briefcase} label="Paket" value={fab.paket?.nama_paket} iconBg="bg-rose-100 dark:bg-rose-500/20" iconColor="text-rose-600 dark:text-rose-400" />
            </div>
          </div>

          {/* Alamat */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 py-1">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">Alamat</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600" />
            </div>

            <InfoCardFull icon={MapPin} label="Alamat Lengkap" value={fab.alamat} iconBg="bg-sky-100 dark:bg-sky-500/20" iconColor="text-sky-600 dark:text-sky-400" />

            {/* Tombol buka Google Maps */}
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-600 transition-colors hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20"
              >
                <ExternalLink size={12} />
                Buka di Google Maps
              </a>
            )}

            {/* Map Preview */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden dark:border-slate-700">
              {hasValidCoords ? (
                <LocationPickerMap lat={lat} lng={lng} height="160px" readOnly />
              ) : (
                <div className="h-[160px] flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/50 text-slate-400">
                  <MapPin size={24} />
                  <span className="text-xs">Koordinat belum tersedia</span>
                </div>
              )}
            </div>
          </div>

          {/* Penanggung Jawab */}
          <div className="space-y-2">
            <SectionDivider>Penanggung Jawab</SectionDivider>
            <div className="grid grid-cols-2 gap-2">
              <InfoCard icon={Users} label="Sales" value={fab.users?.nama} iconBg="bg-violet-100 dark:bg-violet-500/20" iconColor="text-violet-600 dark:text-violet-400" />
              <InfoCard icon={CreditCard} label="Diinput Oleh" value={fab.penginput?.nama} iconBg="bg-indigo-100 dark:bg-indigo-500/20" iconColor="text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>

          {/* Info Waktu */}
          <div className="space-y-2">
            <SectionDivider>Informasi</SectionDivider>
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tanggal Dibuat</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatDateLong(fab.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}