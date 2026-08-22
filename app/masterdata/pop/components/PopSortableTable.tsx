"use client";

import { useState, useMemo, ReactNode, useEffect, useRef } from "react";
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
import { MapPin as MapPinIcon } from "lucide-react";
import { PopFormDialog } from "./PopFormDialog";
import { DeletePopDialog } from "./DeletePopDialog";
import { PopSearch } from "./PopSearch";
import { PopPagination } from "./PopPagination";
import { PopMapDialog } from "./PopMapDialog";
import { OpenGoogleMaps } from "@/components/ui/OpenGoogleMaps";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Pop = {
  id_pop: number;
  kode_pop: string;
  nama_pop: string;
  alamat: string;
  id_area: number;
  latitude: number;
  longitude: number;
  area?: { nama_area: string };
  createdAt: Date;
};

type CurrentUser = {
  id_user: number;
  nama: string;
  role: string;
};

const PAGE_SIZE = 10;

export function PopSortableTable({
  initialData,
  areas,
  defaultValue,
  canDelete = false,
  actions,
  currentUser,
}: {
  initialData: Pop[];
  areas: { id_area: number; nama_area: string }[];
  defaultValue: string;
  canDelete?: boolean;
  actions?: ReactNode;
  currentUser?: CurrentUser;
}) {
  const [search, setSearch] = useState(defaultValue);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

  // Handle highlight dari Command Palette (query param: highlight=<id_pop>)
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

    const item = initialData.find((p) => p.id_pop === targetId);
    if (!item) return;

    // Set search ke nama POP - ini akan sync ke PopSearch via onChange
    setSearch(item.nama_pop);
    setPage(1);

    // Update URL search param agar sinkron dengan state
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("search", item.nama_pop);
      url.searchParams.delete("highlight");
      url.searchParams.set("page", "1");
      window.history.replaceState({}, "", url.toString());
    }, 100);

    setTimeout(() => {
      setHighlightedId(targetId);
      setTimeout(() => {
        const row = rowRefs.current.get(targetId);
        if (row) row.scrollIntoView({ behavior: "smooth", block: "center" });
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
      (pop) =>
        pop.kode_pop.toLowerCase().includes(query) ||
        pop.nama_pop.toLowerCase().includes(query) ||
        pop.alamat.toLowerCase().includes(query) ||
        (pop.area?.nama_area?.toLowerCase().includes(query) ?? false)
    );
  }, [initialData, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const result = a.kode_pop.localeCompare(b.kode_pop, undefined, { numeric: true });
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
    const allSelected = paginated.every((item) => selectedIds.has(item.id_pop));
    if (selectAllPage && allSelected) {
      setSelectAllPage(false);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((item) => next.delete(item.id_pop));
        return next;
      });
    } else {
      setSelectAllPage(true);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((item) => next.add(item.id_pop));
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
        ? `/api/pop/export`
        : `/api/pop/export?ids=${ids.join(",")}`;

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
        : `Export_POP_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlBlob;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);

      toast.success(`Berhasil mengekspor ${ids.length} data POP`);
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
  };

  return (
    <Card className="rounded-3xl border shadow-xl transition-all duration-300 hover:shadow-2xl dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
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
                  className="h-9 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
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
          <PopSearch value={search} onChange={setSearch} />
          <div className="flex items-center gap-2">
            {actions}
            <PopFormDialog mode="create" areas={areas} />
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
                        paginated.length > 0 && paginated.every((item) => selectedIds.has(item.id_pop))
                          ? "border-purple-500 bg-purple-500"
                          : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                      }`}
                    >
                      {paginated.length > 0 && paginated.every((item) => selectedIds.has(item.id_pop)) && (
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
                <TableHead className="dark:text-slate-300">Nama POP</TableHead>
                <TableHead className="dark:text-slate-300">Alamat</TableHead>
                <TableHead className="dark:text-slate-300">Area</TableHead>
                <TableHead className="dark:text-slate-300">Dibuat</TableHead>
                <TableHead className="text-center dark:text-slate-300">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {search ? "Tidak ada data POP yang cocok" : "Belum ada data POP"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((pop) => (
                  <TableRow
                    key={pop.id_pop}
                    ref={(el) => { if (el) rowRefs.current.set(pop.id_pop, el); else rowRefs.current.delete(pop.id_pop); }}
                    className={cn("border-b border-slate-200 dark:border-slate-800 transition-colors", {
                      "bg-purple-50 dark:bg-purple-500/10": selectedIds.has(pop.id_pop),
                      "hover:bg-slate-50 dark:hover:bg-slate-800/50": !selectedIds.has(pop.id_pop),
                      "bg-yellow-100 dark:bg-yellow-500/20 ring-2 ring-yellow-400 dark:ring-yellow-500": highlightedId === pop.id_pop,
                    })}
                  >
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(pop.id_pop);
                        }}
                        className="inline-flex items-center justify-center"
                      >
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                            selectedIds.has(pop.id_pop)
                              ? "border-purple-500 bg-purple-500"
                              : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                          }`}
                        >
                          {selectedIds.has(pop.id_pop) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="font-medium dark:text-slate-200">
                      {pop.kode_pop}
                    </TableCell>
                    <TableCell className="dark:text-slate-300">{pop.nama_pop}</TableCell>
                    <TableCell className="dark:text-slate-300">{pop.alamat}</TableCell>
                    <TableCell className="dark:text-slate-300">{pop.area?.nama_area}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">
                      {new Date(pop.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-1 group/action">
                        <PopMapDialog
                          nama={pop.nama_pop}
                          lat={Number(pop.latitude)}
                          lng={Number(pop.longitude)}
                        />
                        <OpenGoogleMaps
                          lat={Number(pop.latitude)}
                          lng={Number(pop.longitude)}
                          name={pop.nama_pop}
                        />
                        <PopFormDialog
                          mode="edit"
                          areas={areas}
                          data={{
                            id_pop: pop.id_pop,
                            nama_pop: pop.nama_pop,
                            alamat: pop.alamat,
                            id_area: pop.id_area,
                            latitude: pop.latitude,
                            longitude: pop.longitude,
                          }}
                        />
                        {canDelete && <DeletePopDialog id={pop.id_pop} namaPop={pop.nama_pop} />}
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
          {paginated.length === 0 ? (
            <div className="rounded-2xl border py-10 text-center text-slate-400 dark:border-slate-800 dark:text-slate-500">
              {search ? "Tidak ada data POP yang cocok" : "Belum ada data POP"}
            </div>
          ) : (
            paginated.map((pop) => (
              <div
                key={pop.id_pop}
                className={`space-y-2 rounded-2xl border p-4 dark:border-slate-800 dark:bg-slate-900 ${
                  selectedIds.has(pop.id_pop) ? "border-purple-300 bg-purple-50 dark:bg-purple-500/10" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSelect(pop.id_pop)}
                    className="flex items-center gap-3"
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                        selectedIds.has(pop.id_pop)
                          ? "border-purple-500 bg-purple-500"
                          : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                      }`}
                    >
                      {selectedIds.has(pop.id_pop) && (
                        <Check className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold dark:text-white">{pop.nama_pop}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">{pop.kode_pop}</p>
                    </div>
                  </button>
                  <div className="flex shrink-0 gap-1">
                    <PopMapDialog
                      nama={pop.nama_pop}
                      lat={Number(pop.latitude)}
                      lng={Number(pop.longitude)}
                    />
                    <OpenGoogleMaps
                      lat={Number(pop.latitude)}
                      lng={Number(pop.longitude)}
                      name={pop.nama_pop}
                    />
                    <PopFormDialog
                      mode="edit"
                      areas={areas}
                      data={{
                        id_pop: pop.id_pop,
                        nama_pop: pop.nama_pop,
                        alamat: pop.alamat,
                        id_area: pop.id_area,
                        latitude: pop.latitude,
                        longitude: pop.longitude,
                      }}
                    />
                    {canDelete && <DeletePopDialog id={pop.id_pop} namaPop={pop.nama_pop} />}
                  </div>
                </div>
                <p className="flex items-start gap-1 text-sm text-slate-600 dark:text-slate-300">
                  <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                  {pop.alamat}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Area: {pop.area?.nama_area}</p>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <PopPagination page={page} totalPages={totalPagesCalc} />
        </div>
      </CardContent>

      {/* Bulk Delete Dialog */}
      {bulkDeleteOpen && bulkDeleteIds.length > 0 && (
        <DeletePopDialog
          id={bulkDeleteIds[0]}
          namaPop={`${bulkDeleteIds.length} POP`}
          bulkIds={bulkDeleteIds}
          open={bulkDeleteOpen}
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
