"use client";

import { useState } from "react";
import { Image as ImageIcon, ImageOff, Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const FabImageDialog = ({
  fotoUrl,
  namaPelanggan,
  trigger,
}: {
  fotoUrl: string | null | undefined;
  namaPelanggan: string;
  trigger?: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!fotoUrl) return;

    setIsDownloading(true);
    try {
      const response = await fetch(fotoUrl);
      if (!response.ok) {
        throw new Error("Gagal mengambil gambar");
      }

      const blob = await response.blob();

      // Tentukan ekstensi file dari content-type, fallback ke .jpg
      const contentType = response.headers.get("Content-Type") ?? "";
      const extMatch = contentType.match(/image\/(\w+)/);
      const ext = extMatch ? extMatch[1].replace("jpeg", "jpg") : "jpg";

      const safeName = namaPelanggan
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "");

      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlBlob;
      link.download = `Foto_Rumah_${safeName || "pelanggan"}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);

      toast.success("Berhasil mengunduh gambar");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Terjadi kesalahan saat mengunduh gambar");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!fotoUrl) {
    if (trigger) return null;
    return (
      <span className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-500">
        <ImageOff className="h-4 w-4" />
        Tidak Ada
      </span>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={
          trigger
            ? "block w-full cursor-pointer text-left"
            : "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800"
        }
      >
        {trigger ?? (
          <>
            <ImageIcon className="h-4 w-4 text-purple-600 dark:text-fuchsia-400" />
            <span className="text-xs font-medium">Lihat</span>
          </>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-w-6xl">
        <DialogHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pr-8">
          <DialogTitle className="text-slate-900 dark:text-slate-100">
            Foto Depan Rumah - {namaPelanggan}
          </DialogTitle>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleDownload}
            disabled={isDownloading}
            className="h-9 shrink-0 gap-1.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download
          </Button>
        </DialogHeader>

        <div className="mt-2 flex items-center justify-center overflow-auto rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
          <img
            src={fotoUrl}
            alt={namaPelanggan}
            className="max-h-[88vh] w-full rounded-xl object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};