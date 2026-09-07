"use client";

import { useState, useMemo, ReactNode, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Lock, Check, Trash2, Download, X, Loader2, Calendar, Filter, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OltFormDialog } from "./OltFormDialog";
import { DeleteOltDialog } from "./DeleteOltDialog";
import { OltSearch } from "./OltSearch";
import { OltPagination } from "./OltPagination";
import { OltMapDialog } from "./OltMapDialog";
import { OpenGoogleMaps } from "@/components/ui/OpenGoogleMaps";
import { OltSecretCell } from "./OltSecretCell";
import { OltImageDialog } from "./OltImageDialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Olt = {
  id_olt: number;
  kode_olt: string;
  nama_olt: string;
  lokasi: string;
  latitude: string | number;
  longitude: string | number;
  id_pop: number;
  ip_olt?: string | null;
  username_olt?: string | null;
  password_olt?: string | null;
  foto_olt?: string | null;
  pop?: { nama_pop: string } | null;
  createdAt: Date;
};

type CurrentUser = {
  id_user: number;
  nama: string;
  role: string;
};

const PAGE_SIZE = 10;

function LockedCell() {
  return (
    <span
      className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500"
      title="Hanya Admin/Leader yang bisa melihat data ini"
    >
      <Lock className="h-3.5 w-3.5" />
      <span className="text-xs">Terbatas</span>
    </span>
  );
}

export function OltSortableTable({
  initialData,
  pops,
  defaultValue,
  currentRole,
  actions,
  currentUser,
  kodeOtomatis,
}: {
  initialData: Olt[];
  pops: { id_pop: number; nama_pop: string; alamat: string }[];
  defaultValue: string;
  currentRole: string;
  actions?: ReactNode;
  currentUser?: CurrentUser;
  kodeOtomatis: string;
}) {
  const router = useRouter();
  const canViewSecret = currentRole === "ADMIN" || currentRole === "LEADER";

  const [search, setSearch] = useState(defaultValue);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Filter Tahun & POP
  const getCurrentYear = () => new Date().getFullYear();
  const [filterTahun, setFilterTahun] = useState<string>("all");
  const [filterPop, setFilterPop] = useState<string>("all");

  const yearOptions = useMemo(() => {
    const current = getCurrentYear();
    return ["all", String(current - 2), String(current - 1), String(current)];
  }, []);

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
  }, [search, filterTahun, filterPop]);

  // Handle highlight dari Command Palette (query param: highlight=<id_olt>)
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
    const item = initialData.find((o) => o.id_olt === targetId);
    if (!item) return;

    // Set search ke nama OLT - ini akan sync ke OltSearch via onChange
    setSearch(item.nama_olt);
    setFilterTahun("all");
    setFilterPop("all");
    setPage(1);

    // Update URL search param agar sinkron dengan state
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("search", item.nama_olt);
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
    return initialData.filter((olt) => {
      const matchesSearch =
        olt.kode_olt.toLowerCase().includes(query) ||
        olt.nama_olt.toLowerCase().includes(query) ||
        olt.lokasi.toLowerCase().includes(query) ||
        (olt.pop?.nama_pop?.toLowerCase().includes(query) ?? false);

      const itemYear = String(new Date(olt.createdAt).getFullYear());
      const matchesTahun = filterTahun === "all" || itemYear === filterTahun;

      const matchesPop = filterPop === "all" || olt.id_pop === Number(filterPop);

      return matchesSearch && matchesTahun && matchesPop;
    });
  }, [initialData, search, filterTahun, filterPop]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const result = a.kode_olt.localeCompare(b.kode_olt, undefined, { numeric: true });
      return sortOrder === "asc" ? result : -result;
    });
  }, [filtered, sortOrder]);

  const totalPagesCalc = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearTahunFilter = () => {
    setFilterTahun("all");
    setPage(1);
  };

  const clearPopFilter = () => {
    setFilterPop("all");
    setPage(1);
  };

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
    const allSelected = paginated.every((item) => selectedIds.has(item.id_olt));
    if (selectAllPage && allSelected) {
      setSelectAllPage(false);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((item) => next.delete(item.id_olt));
        return next;
      });
    } else {
      setSelectAllPage(true);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((item) => next.add(item.id_olt));
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
        ? `/api/olt/export`
        : `/api/olt/export?ids=${ids.join(",")}`;

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
        : `Export_OLT_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlBlob;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);

      toast.success(`Berhasil mengekspor ${ids.length} data OLT`);
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
    setIsBulkDeleting(true);
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

        {/* Baris 1: Search + Aksi */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <OltSearch value={search} onChange={setSearch} />
          <div className="flex items-center gap-2">
            {actions}
            <OltFormDialog mode="create" pops={pops} kodeOtomatis={kodeOtomatis} />
          </div>
        </div>

        {/* Baris 2: Filter Tahun + Filter POP */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Dropdown Tahun */}
          <Select value={filterTahun} onValueChange={(value) => { if (value) { setFilterTahun(value); setPage(1); } }}>
            <SelectTrigger className="h-11 w-[150px] rounded-2xl border-slate-200 bg-white shadow-sm transition-colors hover:border-purple-300 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700">
              <Calendar className="h-4 w-4 mr-2 text-purple-500 shrink-0" />
              <SelectValue>
                {filterTahun === "all" ? (<span>Semua Thn</span>) : (<span>{filterTahun}</span>)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 p-1.5 shadow-lg dark:border-slate-700 z-[100]">
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year} className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{year === "all" ? "Semua" : year}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filterTahun !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearTahunFilter}
              className="h-11 w-11 p-0 rounded-2xl border border-slate-200 dark:border-slate-700"
            >
              <X className="h-4 w-4 text-slate-500" />
            </Button>
          )}

          {/* Filter Dropdown POP */}
          <Select value={filterPop} onValueChange={(value) => { if (value) { setFilterPop(value); setPage(1); } }}>
            <SelectTrigger className="h-11 w-[190px] rounded-2xl border-slate-200 bg-white shadow-sm transition-colors hover:border-purple-300 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700">
              <MapPin className="h-4 w-4 mr-2 text-purple-500 shrink-0" />
              <SelectValue placeholder="Filter POP">
                {filterPop !== "all" ? pops.find((p) => String(p.id_pop) === filterPop)?.nama_pop : "Semua POP"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 p-1.5 shadow-lg dark:border-slate-700 z-[100]">
              <SelectItem value="all" className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10">
                <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Semua POP</span>
              </SelectItem>
              {pops.map((pop) => (
                <SelectItem key={pop.id_pop} value={String(pop.id_pop)} className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{pop.nama_pop}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filterPop !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearPopFilter}
              className="h-11 w-11 p-0 rounded-2xl border border-slate-200 dark:border-slate-700"
            >
              <X className="h-4 w-4 text-slate-500" />
            </Button>
          )}
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
                        paginated.length > 0 && paginated.every((item) => selectedIds.has(item.id_olt))
                          ? "border-purple-500 bg-purple-500"
                          : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                      }`}
                    >
                      {paginated.length > 0 && paginated.every((item) => selectedIds.has(item.id_olt)) && (
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
                <TableHead className="dark:text-slate-300">Foto</TableHead>
                <TableHead className="dark:text-slate-300">Nama OLT</TableHead>
                <TableHead className="dark:text-slate-300">Lokasi</TableHead>
                <TableHead className="dark:text-slate-300">POP</TableHead>
                <TableHead className="dark:text-slate-300">IP Address</TableHead>
                <TableHead className="dark:text-slate-300">Username</TableHead>
                <TableHead className="dark:text-slate-300">Password</TableHead>
                <TableHead className="dark:text-slate-300">Dibuat</TableHead>
                <TableHead className="text-center dark:text-slate-300">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {search ? "Tidak ada data OLT yang cocok" : "Belum ada data OLT"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((olt) => (
                  <TableRow
                    key={olt.id_olt}
                    ref={(el) => { if (el) rowRefs.current.set(olt.id_olt, el); else rowRefs.current.delete(olt.id_olt); }}
                    className={cn(
                      "border-b border-slate-100 transition-colors",
                      selectedIds.has(olt.id_olt)
                        ? "bg-purple-50 dark:bg-purple-500/10"
                        : "hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800",
                      highlightedId === olt.id_olt && "bg-yellow-100 dark:bg-yellow-500/20 ring-2 ring-yellow-400 dark:ring-yellow-500"
                    )}
                  >
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(olt.id_olt);
                        }}
                        className="inline-flex items-center justify-center"
                      >
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                            selectedIds.has(olt.id_olt)
                              ? "border-purple-500 bg-purple-500"
                              : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                          }`}
                        >
                          {selectedIds.has(olt.id_olt) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                      {olt.kode_olt}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <OltImageDialog fotoUrl={olt.foto_olt} namaOlt={olt.nama_olt} />
                    </TableCell>
                    <TableCell className="dark:text-slate-300">{olt.nama_olt}</TableCell>
                    <TableCell className="dark:text-slate-300">{olt.lokasi}</TableCell>
                    <TableCell className="dark:text-slate-300">{olt.pop?.nama_pop}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {canViewSecret ? (
                        <OltSecretCell value={olt.ip_olt ?? null} />
                      ) : (
                        <LockedCell />
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {canViewSecret ? (
                        <OltSecretCell value={olt.username_olt ?? null} />
                      ) : (
                        <LockedCell />
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {canViewSecret ? (
                        <OltSecretCell value={olt.password_olt ?? null} />
                      ) : (
                        <LockedCell />
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400" onClick={(e) => e.stopPropagation()}>
                      {new Date(olt.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-1">
                        <OltMapDialog nama={olt.nama_olt} lat={Number(olt.latitude)} lng={Number(olt.longitude)} />
                        <OpenGoogleMaps lat={Number(olt.latitude)} lng={Number(olt.longitude)} name={olt.nama_olt} />
                        <OltFormDialog mode="edit" pops={pops} data={{ id_olt: olt.id_olt, kode_olt: olt.kode_olt, nama_olt: olt.nama_olt, lokasi: olt.lokasi, latitude: String(olt.latitude), longitude: String(olt.longitude), id_pop: olt.id_pop, ip_olt: olt.ip_olt, username_olt: olt.username_olt, password_olt: olt.password_olt, foto_olt: olt.foto_olt }} />
                        <DeleteOltDialog id={olt.id_olt} namaOlt={olt.nama_olt} />
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
              {search ? "Tidak ada data OLT yang cocok" : "Belum ada data OLT"}
            </div>
          ) : (
            paginated.map((olt) => (
              <div
                key={olt.id_olt}
                className={`space-y-2 rounded-2xl border p-4 dark:border-slate-800 dark:bg-slate-900/50 ${
                  selectedIds.has(olt.id_olt) ? "border-purple-300 bg-purple-50 dark:bg-purple-500/10" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSelect(olt.id_olt)}
                    className="flex items-center gap-3"
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                        selectedIds.has(olt.id_olt)
                          ? "border-purple-500 bg-purple-500"
                          : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                      }`}
                    >
                      {selectedIds.has(olt.id_olt) && (
                        <Check className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold dark:text-slate-100">{olt.nama_olt}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{olt.kode_olt}</p>
                    </div>
                  </button>
                  <div className="flex shrink-0 gap-1">
                    <OpenGoogleMaps lat={Number(olt.latitude)} lng={Number(olt.longitude)} name={olt.nama_olt} />
                    <OltFormDialog mode="edit" pops={pops} data={{ id_olt: olt.id_olt, kode_olt: olt.kode_olt, nama_olt: olt.nama_olt, lokasi: olt.lokasi, latitude: String(olt.latitude), longitude: String(olt.longitude), id_pop: olt.id_pop, ip_olt: olt.ip_olt, username_olt: olt.username_olt, password_olt: olt.password_olt, foto_olt: olt.foto_olt }} />
                    <DeleteOltDialog id={olt.id_olt} namaOlt={olt.nama_olt} />
                  </div>
                </div>
                <p className="text-sm dark:text-slate-300">{olt.lokasi}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">POP: {olt.pop?.nama_pop ?? "-"}</p>

                <div className="space-y-1 border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 dark:text-slate-500">IP:</span>
                    {canViewSecret ? (
                      <OltSecretCell value={olt.ip_olt ?? null} />
                    ) : (
                      <LockedCell />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 dark:text-slate-500">Username:</span>
                    {canViewSecret ? (
                      <OltSecretCell value={olt.username_olt ?? null} />
                    ) : (
                      <LockedCell />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 dark:text-slate-500">Password:</span>
                    {canViewSecret ? (
                      <OltSecretCell value={olt.password_olt ?? null} />
                    ) : (
                      <LockedCell />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <OltPagination page={page} totalPages={totalPagesCalc} />
        </div>
      </CardContent>

      {/* Bulk Delete Dialog */}
      {bulkDeleteOpen && bulkDeleteIds.length > 0 && (
        <DeleteOltDialog
          id={bulkDeleteIds[0]}
          namaOlt={`${bulkDeleteIds.length} OLT`}
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