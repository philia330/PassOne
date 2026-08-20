"use client";

import { useState, useEffect } from "react";
import { Eye, Loader2, Package, Calendar, User, Hash, FileText, ExternalLink, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getMaterialBaaUsage } from "@/app/masterdata/material/actions";

interface BaaUsageData {
  id_baa: number;
  kode_baa: string;
  tanggal_instalasi: Date;
  nama_pelanggan: string;
  jumlah: number;
  keterangan: string | null;
  teknisi_utama: string;
}

interface MaterialBaaUsageDialogProps {
  idMaterial: number;
  namaMaterial: string;
  satuanMaterial: string;
}

export function MaterialBaaUsageDialog({
  idMaterial,
  namaMaterial,
  satuanMaterial,
}: MaterialBaaUsageDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usageData, setUsageData] = useState<BaaUsageData[]>([]);
  const [totalDigunakan, setTotalDigunakan] = useState(0);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getMaterialBaaUsage(idMaterial)
        .then((result) => {
          setUsageData(result.usageData);
          setTotalDigunakan(result.totalDigunakan);
        })
        .catch((error) => {
          console.error("Error fetching BAA usage:", error);
          setUsageData([]);
          setTotalDigunakan(0);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, idMaterial]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Download daftar penggunaan sebagai CSV
  const handleDownloadCsv = () => {
    const header = ["Kode BAA", "Tanggal Instalasi", "Pelanggan", "Teknisi", `Jumlah (${satuanMaterial})`, "Keterangan"];
    const rows = usageData.map((baa) => [
      baa.kode_baa,
      formatDate(baa.tanggal_instalasi),
      baa.nama_pelanggan,
      baa.teknisi_utama,
      String(baa.jumlah),
      baa.keterangan ?? "",
    ]);

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csvContent = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `penggunaan-${namaMaterial.replace(/\s+/g, "-").toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer rounded-xl active:scale-90 transition-transform"
          title={`Lihat penggunaan di BAA`}
        >
          <Eye className="h-4 w-4 text-purple-600 hover:text-purple-700 active:scale-90 transition-all dark:text-purple-400 dark:hover:text-purple-300" />
        </Button>
      </DialogTrigger>

      <DialogContent
        className="
          flex h-full max-h-[100dvh] w-full max-w-full flex-col
          overflow-hidden rounded-none p-0
          sm:h-auto sm:max-h-[85vh] sm:max-w-3xl sm:rounded-3xl sm:p-6
        "
      >
        {/* Tombol download -- ditaruh di sebelah kiri tombol X bawaan DialogContent (right-4 top-4) */}
        {usageData.length > 0 && (
          <button
            type="button"
            onClick={handleDownloadCsv}
            title="Download CSV"
            className="absolute right-14 top-4 z-10 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 sm:right-12"
          >
            <Download className="h-4 w-4" />
          </button>
        )}

        <DialogHeader className="flex-shrink-0 px-4 pt-4 sm:px-0 sm:pt-0 border-b dark:border-slate-800 pb-4">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Penggunaan Material
          </DialogTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {namaMaterial}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : usageData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-6">
              <Package className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-center font-medium">Material belum digunakan di BAA manapun</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="flex-shrink-0 px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-b dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Total Digunakan:
                  </span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {totalDigunakan} {satuanMaterial}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Jumlah BAA:
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {usageData.length} BAA
                  </span>
                </div>
              </div>

              {/* BAA List */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {usageData.map((baa) => (
                    <a
                      key={baa.id_baa}
                      href={`/workspace?view=baa&id_baa=${baa.id_baa}`}
                      className="block rounded-2xl border border-slate-200 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          {/* Header */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-lg">
                              <Hash className="h-3 w-3" />
                              {baa.kode_baa}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                              <Calendar className="h-3 w-3" />
                              {formatDate(baa.tanggal_instalasi)}
                            </span>
                          </div>

                          {/* Pelanggan */}
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {baa.nama_pelanggan}
                            </span>
                          </div>

                          {/* Teknisi */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              Teknisi:
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-300">
                              {baa.teknisi_utama}
                            </span>
                          </div>

                          {/* Keterangan */}
                          {baa.keterangan && (
                            <div className="flex items-start gap-2">
                              <FileText className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {baa.keterangan}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Jumlah -- klik ikon ini (atau seluruh card) langsung ke halaman BAA terkait */}
                        <div className="flex flex-col items-end gap-1">
                          <span className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white text-sm font-bold rounded-xl min-w-[60px]">
                            {baa.jumlah}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {satuanMaterial}
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mt-1" />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}