"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Check, Trash2, Download, X, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OdpFormDialog } from "./OdpFormDialog";
import { DeleteOdpDialog } from "./DeleteOdpDialog";
import { OdpSearch } from "./OdpSearch";
import { OdpPagination } from "./OdpPagination";
import { OdpMapDialog } from "./OdpMapDialog";
import { OdpConnectionDialog } from "./OdpConnectionDialog";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/ui/ExportButton";
import { toast } from "sonner";

type Olt = { id_olt: number; nama_olt: string };

type Odp = {
  id_odp: number;
  kode_odp: string;
  nama_odp: string;
  alamat: string;
  latitude: string | number;
  longitude: string | number;
  id_olt: number;
  jumlah_port?: number | null;
  olt?: { id_olt: number; nama_olt: string } | null;
  _count?: { ont: number; baa: number };
};

type CurrentUser = {
  id_user: number;
  nama: string;
  role: string;
};

const PAGE_SIZE = 10;

export function OdpSortableTable({
  initialData,
  olts,
  defaultValue,
  currentUser,
}: {
  initialData: Odp[];
  olts: Olt[];
  defaultValue: string;
  currentUser?: CurrentUser;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(defaultValue);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectAllPage, setSelectAllPage] = useState(false);

  // Highlight state untuk Command Palette
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const highlightHandled = useRef(false);
  const lastHighlightId = useRef<string | null>(null);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

  const isAdmin = currentUser?.role === "ADMIN";
  const canBulkDelete = isAdmin;
  // Hanya Admin dan Leader yang bisa export (samakan dengan hak akses halaman ODP)
  const canExport = currentUser?.role === "ADMIN" || currentUser?.role === "LEADER";

  // Clear selection when filters/search change
  useEffect(() => {
    setSelectedIds(new Set());
    setSelectAllPage(false);
  }, [search]);

  // Handle highlight dari Command Palette (query param: highlight=<id_odp>)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const highlightId = params.get("highlight");

    // Reset highlightHandled jika nilai highlight berubah (软导航后新值)
    if (highlightId !== lastHighlightId.current) {
      highlightHandled.current = false;
      lastHighlightId.current = highlightId;
    }

    if (!highlightId || highlightHandled.current) return;
    highlightHandled.current = true;

    const targetId = Number(highlightId);
    if (isNaN(targetId)) return;

    // Cari item di data
    const item = initialData.find((o) => o.id_odp === targetId);
    if (!item) return;

    // Set search ke nama ODP - ini akan sync ke OdpSearch via onChange
    setSearch(item.nama_odp);
    setPage(1);

    // Update URL search param agar sinkron dengan state
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("search", item.nama_odp);
      url.searchParams.delete("highlight");
      url.searchParams.set("page", "1");
      window.history.replaceState({}, "", url.toString());
    }, 100);

    // Highlight baris setelah render
    setTimeout(() => {
      setHighlightedId(targetId);

      // Scroll ke baris
      setTimeout(() => {
        const row = rowRefs.current.get(targetId);
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        // Hapus highlight setelah 3 detik
        setTimeout(() => setHighlightedId(null), 3000);
      }, 100);
    }, 200);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return initialData.filter(
      (odp) =>
        odp.kode_odp.toLowerCase().includes(query) ||
        odp.nama_odp.toLowerCase().includes(query) ||
        odp.alamat.toLowerCase().includes(query) ||
        (odp.olt?.nama_olt?.toLowerCase().includes(query) ?? false)
    );
  }, [initialData, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const result = a.kode_odp.localeCompare(b.kode_odp, undefined, { numeric: true });
      return sortOrder === "asc" ? result : -result;
    });
  }, [filtered, sortOrder]);

  const totalPagesCalc = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Selection functions
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allSelected = paginated.every((item) => selectedIds.has(item.id_odp));
    if (selectAllPage && allSelected) {
      setSelectAllPage(false);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((item) => next.delete(item.id_odp));
        return next;
      });
    } else {
      setSelectAllPage(true);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((item) => next.add(item.id_odp));
        return next;
      });
    }
  };

  // Bulk export handler
  const handleBulkExport = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.error("Pilih item yang ingin diekspor");
      return;
    }

    setIsExporting(true);
    try {
      const url = ids.length === sorted.length
        ? `/api/odp/export`
        : `/api/odp/export?ids=${ids.join(",")}`;

      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Gagal mengekspor data");
        return;
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `Export_ODP_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlBlob;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);

      toast.success(`Berhasil mengekspor ${ids.length} data ODP`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Terjadi kesalahan saat mengekspor data");
    } finally {
      setIsExporting(false);
    }
  };

  // Bulk delete handler
  const handleBulkDelete = () => {
    setIsBulkDeleting(true);
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.error("Pilih item yang ingin dihapus");
      return;
    }
    setBulkDeleteIds(ids);
    setBulkDeleteOpen(true);
  };

  // Handle delete success
  const handleDeleteSuccess = () => {
    setSelectedIds(new Set());
    setSelectAllPage(false);
    setBulkDeleteOpen(false);
    setBulkDeleteIds([]);
    setIsBulkDeleting(false);
    router.refresh();
  };

  return (
    <Card className="rounded-3xl border shadow-xl transition-all hover:shadow-2xl dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
      <CardContent className="space-y-6 p-4 sm:p-6">
        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-purple-50 p-3 sm:p-4 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white font-bold text-sm">
                {selectedIds.size}
              </span>
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                item dipilih
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canBulkDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="h-9 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  {isBulkDeleting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
                  Hapus
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleBulkExport}
                disabled={isExporting}
                className="h-9 rounded-xl text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-500/10"
              >
                {isExporting ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-4 w-4" />
                )}
                Export Excel
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setSelectedIds(new Set()); setSelectAllPage(false); }}
                className="h-9 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="mr-1.5 h-4 w-4" />
                Batal
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <OdpSearch value={search} onChange={setSearch} />
          <div className="flex items-center gap-2">
            {canExport && (
              <ExportButton apiUrl="/api/odp/export" filenamePrefix="Export_ODP" />
            )}
            <div className="add-button">
              <OdpFormDialog mode="create" olts={olts} />
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto rounded-2xl border dark:border-slate-800 md:block table-container">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <TableHead className="w-12 text-center dark:text-slate-300">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="inline-flex items-center justify-center"
                    title={selectAllPage ? "Batalkan pilih semua halaman ini" : "Pilih semua halaman ini"}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                        paginated.length > 0 && paginated.every((item) => selectedIds.has(item.id_odp))
                          ? "border-purple-500 bg-purple-500"
                          : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                      }`}
                    >
                      {paginated.length > 0 && paginated.every((item) => selectedIds.has(item.id_odp)) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </button>
                </TableHead>
                <TableHead className="dark:text-slate-300">
                  <button
                    type="button"
                    onClick={toggleSort}
                    className="inline-flex items-center gap-1.5 hover:text-purple-600 transition-colors"
                  >
                    Kode
                    {sortOrder === "asc" ? (
                      <ArrowUp size={16} className="text-purple-500" />
                    ) : (
                      <ArrowDown size={16} className="text-purple-500" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="dark:text-slate-300">Nama ODP</TableHead>
                <TableHead className="dark:text-slate-300">Alamat</TableHead>
                <TableHead className="dark:text-slate-300">OLT</TableHead>
                <TableHead className="text-center dark:text-slate-300">Port</TableHead>
                <TableHead className="text-center dark:text-slate-300">Terhubung</TableHead>
                <TableHead className="text-center dark:text-slate-300">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {search ? "Tidak ada data ODP yang cocok" : "Belum ada data ODP"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((odp) => (
                  <TableRow
                    key={odp.id_odp}
                    ref={(el) => { if (el) rowRefs.current.set(odp.id_odp, el); else rowRefs.current.delete(odp.id_odp); }}
                    className={cn(
                      "border-b border-slate-200 transition-colors",
                      selectedIds.has(odp.id_odp)
                        ? "bg-purple-50 dark:bg-purple-500/10"
                        : "hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50",
                      highlightedId === odp.id_odp && "bg-yellow-100 dark:bg-yellow-500/20 ring-2 ring-yellow-400 dark:ring-yellow-500"
                    )}
                  >
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(odp.id_odp);
                        }}
                        className="inline-flex items-center justify-center"
                      >
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                            selectedIds.has(odp.id_odp)
                              ? "border-purple-500 bg-purple-500"
                              : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                          }`}
                        >
                          {selectedIds.has(odp.id_odp) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="font-medium dark:text-slate-200" onClick={(e) => e.stopPropagation()}>{odp.kode_odp}</TableCell>
                    <TableCell className="dark:text-slate-300" onClick={(e) => e.stopPropagation()}>{odp.nama_odp}</TableCell>
                    <TableCell className="dark:text-slate-300" onClick={(e) => e.stopPropagation()}>{odp.alamat}</TableCell>
                    <TableCell className="dark:text-slate-300" onClick={(e) => e.stopPropagation()}>{odp.olt?.nama_olt}</TableCell>
                    <TableCell className="text-center dark:text-slate-400" onClick={(e) => e.stopPropagation()}>{odp.jumlah_port ?? "-"}</TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      {odp._count && (
                        <OdpConnectionDialog
                          odpId={odp.id_odp}
                          odpName={odp.nama_odp}
                          trigger={
                            <span className="cursor-pointer inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium">
                              <span>{odp._count?.ont || 0} ONT</span>
                              <span className="text-slate-400">+</span>
                              <span>{odp._count?.baa || 0} BAA</span>
                            </span>
                          }
                        />
                      )}
                      {!odp._count && <span className="text-slate-400">-</span>}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-1 group/action">
                        <OdpMapDialog currentId={odp.id_odp} odpNama={odp.nama_odp} allPoints={[]} />
                        <OdpFormDialog mode="edit" olts={olts} data={{ id_odp: odp.id_odp, nama_odp: odp.nama_odp, alamat: odp.alamat, latitude: String(odp.latitude), longitude: String(odp.longitude), id_olt: odp.id_olt, jumlah_port: odp.jumlah_port }} />
                        <DeleteOdpDialog id={odp.id_odp} namaOdp={odp.nama_odp} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="grid gap-3 md:hidden">
          {paginated.map((odp) => (
            <div
              key={odp.id_odp}
              className={`space-y-2 rounded-2xl border p-4 dark:border-slate-800 dark:bg-slate-800/40 ${
                selectedIds.has(odp.id_odp) ? "border-purple-300 bg-purple-50 dark:bg-purple-500/10" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => toggleSelect(odp.id_odp)}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                      selectedIds.has(odp.id_odp)
                        ? "border-purple-500 bg-purple-500"
                        : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                    }`}
                  >
                    {selectedIds.has(odp.id_odp) && (
                      <Check className="h-3.5 w-3.5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold dark:text-slate-100">{odp.nama_odp}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{odp.kode_odp}</p>
                  </div>
                </button>
                <div className="flex shrink-0 gap-1">
                  <OdpFormDialog mode="edit" olts={olts} data={{ id_odp: odp.id_odp, nama_odp: odp.nama_odp, alamat: odp.alamat, latitude: String(odp.latitude), longitude: String(odp.longitude), id_olt: odp.id_olt, jumlah_port: odp.jumlah_port }} />
                  <DeleteOdpDialog id={odp.id_odp} namaOdp={odp.nama_odp} />
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{odp.alamat}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">OLT: {odp.olt?.nama_olt ?? "-"}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <OdpPagination page={page} totalPages={totalPagesCalc} />
        </div>
      </CardContent>

      {/* Bulk Delete Dialog */}
      {bulkDeleteOpen && bulkDeleteIds.length > 0 && (
        <DeleteOdpDialog
          id={bulkDeleteIds[0]}
          namaOdp={`${bulkDeleteIds.length} ODP`}
          bulkIds={bulkDeleteIds}
          open={bulkDeleteOpen}
          onDeleteStart={() => setIsBulkDeleting(true)}
          onOpenChange={(isOpen) => {
            setBulkDeleteOpen(isOpen);
            if (!isOpen) {
              handleDeleteSuccess();
            }
          }}
        />
      )}
    </Card>
  );
}