"use client";

import { useState, useMemo, ReactNode, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Check, Trash2, Download, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PortPonFormDialog } from "./PortPonFormDialog";
import { DeletePortPonDialog } from "./DeletePortPonDialog";
import { PortPonSearch } from "./PortPonSearch";
import { PortPonPagination } from "./PortPonPagination";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Olt = { id_olt: number; nama_olt: string };
type Odp = { id_odp: number; nama_odp: string };
type CurrentUser = {
  id_user: number;
  nama: string;
  role: string;
};

const statusBadge: Record<string, string> = {
  TERSEDIA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  TERPASANG: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
  RUSAK: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
};

type PortPon = {
  id_port: number;
  nomor_port: number;
  tipe_kartu: string;
  status: "TERSEDIA" | "TERPASANG" | "RUSAK";
  id_olt: number;
  id_odp: number | null;
  olt?: { nama_olt: string };
  odp?: { nama_odp: string } | null;
};

const PAGE_SIZE = 10;

export function PortPonSortableTable({
  initialData,
  olts,
  odps,
  defaultValue,
  actions,
  currentUser,
}: {
  initialData: PortPon[];
  olts: Olt[];
  odps: Odp[];
  defaultValue: string;
  actions?: ReactNode;
  currentUser?: CurrentUser;
}) {
  const router = useRouter();
  const canDelete = currentUser?.role === "ADMIN";
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

  // Clear selection when filters/search change
  useEffect(() => {
    setSelectedIds(new Set());
    setSelectAllPage(false);
  }, [search]);

  // Handle highlight dari Command Palette (query param: highlight=<id_port>)
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

    const item = initialData.find((p) => p.id_port === targetId);
    if (!item) return;

    // Set search ke nama OLT - ini akan sync ke PortPonSearch via onChange
    const searchValue = item.olt?.nama_olt || String(item.nomor_port);
    setSearch(searchValue);
    setPage(1);

    // Update URL search param agar sinkron dengan state
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("search", searchValue);
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
      (port) =>
        (port.olt?.nama_olt?.toLowerCase().includes(query) ?? false) ||
        (port.odp?.nama_odp?.toLowerCase().includes(query) ?? false) ||
        port.tipe_kartu.toLowerCase().includes(query) ||
        port.status.toLowerCase().includes(query)
    );
  }, [initialData, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const result = a.nomor_port - b.nomor_port;
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
    const allSelected = paginated.every((item) => selectedIds.has(item.id_port));
    if (selectAllPage && allSelected) {
      setSelectAllPage(false);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((item) => next.delete(item.id_port));
        return next;
      });
    } else {
      setSelectAllPage(true);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((item) => next.add(item.id_port));
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
        ? `/api/portpon/export`
        : `/api/portpon/export?ids=${ids.join(",")}`;

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
        : `Export_Port_PON_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlBlob;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);

      toast.success(`Berhasil mengekspor ${ids.length} data Port PON`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Terjadi kesalahan saat mengekspor data");
    } finally {
      setIsExporting(false);
    }
  };

  // Bulk delete handler
  const handleBulkDelete = () => {
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
                  {isBulkDeleting ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1.5 h-4 w-4" />
                  )}
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
          <PortPonSearch value={search} onChange={setSearch} />
          <div className="flex items-center gap-2">
            {actions}
            <PortPonFormDialog mode="create" olts={olts} odps={odps} />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto rounded-2xl border dark:border-slate-800 md:block table-container">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                <TableHead className="w-12 text-center dark:text-slate-300">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="inline-flex items-center justify-center"
                    title={selectAllPage ? "Batalkan pilih semua halaman ini" : "Pilih semua halaman ini"}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                        paginated.length > 0 && paginated.every((item) => selectedIds.has(item.id_port))
                          ? "border-purple-500 bg-purple-500"
                          : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                      }`}
                    >
                      {paginated.length > 0 && paginated.every((item) => selectedIds.has(item.id_port)) && (
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
                    OLT
                    {sortOrder === "asc" ? (
                      <ArrowUp size={16} className="text-purple-500" />
                    ) : (
                      <ArrowDown size={16} className="text-purple-500" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="dark:text-slate-300">Status</TableHead>
                <TableHead className="dark:text-slate-300">ODP Terhubung</TableHead>
                <TableHead className="text-center dark:text-slate-300">Nomor Port</TableHead>
                <TableHead className="dark:text-slate-300">Tipe Kartu</TableHead>
                <TableHead className="text-center dark:text-slate-300">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {search ? "Tidak ada data Port PON yang cocok" : "Belum ada data Port PON"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((port) => (
                  <TableRow
                    key={port.id_port}
                    ref={(el) => { if (el) rowRefs.current.set(port.id_port, el); else rowRefs.current.delete(port.id_port); }}
                    className={cn(
                      "border-b border-slate-100 transition-colors",
                      selectedIds.has(port.id_port)
                        ? "bg-purple-50 dark:bg-purple-500/10"
                        : "hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50",
                      highlightedId === port.id_port && "bg-yellow-100 dark:bg-yellow-500/20 ring-2 ring-yellow-400 dark:ring-yellow-500"
                    )}
                  >
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(port.id_port);
                        }}
                        className="inline-flex items-center justify-center"
                      >
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                            selectedIds.has(port.id_port)
                              ? "border-purple-500 bg-purple-500"
                              : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                          }`}
                        >
                          {selectedIds.has(port.id_port) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="font-medium dark:text-slate-200" onClick={(e) => e.stopPropagation()}>{port.olt?.nama_olt}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge[port.status] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{port.status}</span>
                    </TableCell>
                    <TableCell className="dark:text-slate-300" onClick={(e) => e.stopPropagation()}>{port.odp?.nama_odp ?? "-"}</TableCell>
                    <TableCell className="text-center font-medium dark:text-slate-300" onClick={(e) => e.stopPropagation()}>{port.nomor_port}</TableCell>
                    <TableCell className="dark:text-slate-300" onClick={(e) => e.stopPropagation()}>{port.tipe_kartu}</TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-1 group/action">
                        <PortPonFormDialog mode="edit" olts={olts} odps={odps} data={{ id_port_pon: port.id_port, nomor_port: port.nomor_port, tipe_kartu: port.tipe_kartu, status: port.status, id_olt: port.id_olt, id_odp: port.id_odp }} />
                        {canDelete && (
                          <DeletePortPonDialog id={port.id_port} name={`${port.olt?.nama_olt ?? ""} - Port ${port.nomor_port}`} />
                        )}
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
          {paginated.map((port) => (
            <div
              key={port.id_port}
              className={cn(
                "space-y-2 rounded-2xl border p-4 dark:border-slate-800",
                selectedIds.has(port.id_port) ? "border-purple-300 bg-purple-50 dark:bg-purple-500/10" : "",
                highlightedId === port.id_port && "border-yellow-400 bg-yellow-100 ring-2 ring-yellow-400 dark:border-yellow-500 dark:bg-yellow-500/20 dark:ring-yellow-500"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => toggleSelect(port.id_port)}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                      selectedIds.has(port.id_port)
                        ? "border-purple-500 bg-purple-500"
                        : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                    }`}
                  >
                    {selectedIds.has(port.id_port) && (
                      <Check className="h-3.5 w-3.5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold dark:text-slate-100">{port.olt?.nama_olt}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Port {port.nomor_port} · {port.tipe_kartu}</p>
                  </div>
                </button>
                <div className="flex shrink-0 gap-1">
                  <PortPonFormDialog mode="edit" olts={olts} odps={odps} data={{ id_port_pon: port.id_port, nomor_port: port.nomor_port, tipe_kartu: port.tipe_kartu, status: port.status, id_olt: port.id_olt, id_odp: port.id_odp }} />
                  {canDelete && (
                    <DeletePortPonDialog id={port.id_port} name={`${port.olt?.nama_olt ?? ""} - Port ${port.nomor_port}`} />
                  )}
                </div>
              </div>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusBadge[port.status] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{port.status}</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">ODP: {port.odp?.nama_odp ?? "-"}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <PortPonPagination page={page} totalPages={totalPagesCalc} />
        </div>
      </CardContent>

      {/* Bulk Delete Dialog */}
      {bulkDeleteOpen && bulkDeleteIds.length > 0 && (
        <DeletePortPonDialog
          id={bulkDeleteIds[0]}
          name={`${bulkDeleteIds.length} Port PON`}
          bulkIds={bulkDeleteIds}
          open={bulkDeleteOpen}
          onOpenChange={(isOpen) => {
            setBulkDeleteOpen(isOpen);
            if (!isOpen) {
              handleDeleteSuccess();
            }
          }}
          onDeleteStart={() => setIsBulkDeleting(true)}
        />
      )}
    </Card>
  );
}
