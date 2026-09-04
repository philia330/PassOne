"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Wifi, FileText, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type OntItem = {
  id_ont: number;
  serial_number: string;
  pelanggan: string;
  status: string;
};

type BaaItem = {
  id_baa: number;
  kode_baa: string;
  fab: {
    nama_pelanggan: string;
  } | null;
};

type ConnectionData = {
  ont: OntItem[];
  baa: BaaItem[];
};

type OdpConnectionDialogProps = {
  odpId: number;
  odpName: string;
  trigger?: React.ReactNode;
};

export function OdpConnectionDialog({
  odpId,
  odpName,
  trigger,
}: OdpConnectionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ConnectionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/odp/${odpId}/connections`);

      if (!res.ok) {
        throw new Error("Gagal mengambil data koneksi");
      }

      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && !data) {
      fetchConnections();
    }
  };

  // Double-click pada baris ONT: arahkan ke halaman Data ONT, otomatis
  // ter-highlight dan ter-scroll ke baris yang dituju (reuse mekanisme
  // highlight yang sudah dipakai OntSortableTable / Command Palette).
  const handleOntDoubleClick = (ont: OntItem) => {
    setOpen(false);
    router.push(`/masterdata/ont?highlight=${ont.id_ont}`);
  };

  // Double-click pada baris BAA: arahkan ke halaman detail BAA di workspace,
  // konsisten dengan link "Detail & Material" dan double-click di BaaTable.
  const handleBaaDoubleClick = (baa: BaaItem) => {
    setOpen(false);
    router.push(`/workspace?view=baa&id_baa=${baa.id_baa}`);
  };

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200"
      title="Lihat yang terhubung"
    >
      <Link2 className="h-4 w-4 transition-transform duration-200 group-hover:scale-125" />
    </Button>
  );

  return (
    <>
      <div onClick={() => handleOpenChange(true)} className="cursor-pointer group transition-all duration-200">
        {trigger || defaultTrigger}
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-purple-600" />
              Koneksi {odpName}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1.5">
              <MousePointerClick className="h-3.5 w-3.5" />
              Klik 2x pada item untuk membuka halamannya
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {data && !loading && (
              <>
                {/* ONT Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-blue-500" />
                    <h4 className="text-sm font-semibold text-slate-700">
                      ONT ({data.ont.length})
                    </h4>
                  </div>

                  {data.ont.length === 0 ? (
                    <p className="text-sm text-slate-400 italic pl-6">
                      Tidak ada ONT terhubung
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-lg border border-slate-200 p-2">
                      {data.ont.map((ont) => (
                        <div
                          key={ont.id_ont}
                          onDoubleClick={() => handleOntDoubleClick(ont)}
                          title="Klik 2x untuk membuka data ONT ini"
                          className="flex items-center justify-between rounded-md bg-slate-50 p-2 text-sm cursor-pointer select-none hover:bg-purple-50 hover:ring-1 hover:ring-purple-200 transition-colors"
                        >
                          <div>
                            <p className="font-mono font-medium text-slate-700">
                              {ont.serial_number}
                            </p>
                            <p className="text-xs text-slate-500">
                              {ont.pelanggan}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              ont.status === "TERSEDIA"
                                ? "border-green-200 bg-green-50 text-green-600"
                                : ont.status === "TERPASANG"
                                ? "border-blue-200 bg-blue-50 text-blue-600"
                                : "border-red-200 bg-red-50 text-red-600"
                            }`}
                          >
                            {ont.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BAA Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-500" />
                    <h4 className="text-sm font-semibold text-slate-700">
                      BAA ({data.baa.length})
                    </h4>
                  </div>

                  {data.baa.length === 0 ? (
                    <p className="text-sm text-slate-400 italic pl-6">
                      Tidak ada BAA terhubung
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-lg border border-slate-200 p-2">
                      {data.baa.map((baa) => (
                        <div
                          key={baa.id_baa}
                          onDoubleClick={() => handleBaaDoubleClick(baa)}
                          title="Klik 2x untuk membuka detail BAA ini"
                          className="flex items-center justify-between rounded-md bg-slate-50 p-2 text-sm cursor-pointer select-none hover:bg-purple-50 hover:ring-1 hover:ring-purple-200 transition-colors"
                        >
                          <div>
                            <p className="font-mono font-medium text-slate-700">
                              {baa.kode_baa}
                            </p>
                            <p className="text-xs text-slate-500">
                              {baa.fab?.nama_pelanggan || "-"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="rounded-lg bg-purple-50 p-3 text-center">
                  <p className="text-sm font-medium text-purple-700">
                    Total: {data.ont.length} ONT + {data.baa.length} BAA
                  </p>
                </div>
              </>
            )}

            {data && !loading && data.ont.length === 0 && data.baa.length === 0 && (
              <div className="py-8 text-center">
                <Link2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-400">
                  ODP ini belum terhubung ke ONT atau BAA manapun
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}