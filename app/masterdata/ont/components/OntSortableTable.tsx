"use client";

import { useState, useMemo, ReactNode, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  ArrowDown,
  Check,
  Trash2,
  Download,
  X,
  Loader2,
  Printer,
  Calendar,
  Filter,
} from "lucide-react";
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
import { OntFormDialog } from "./OntFormDialog";
import { DeleteOntDialog } from "./DeleteOntDialog";
import { OntSearch } from "./OntSearch";
import { OntPagination } from "./OntPagination";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { OntQrDialog } from "./OntQrDialog";

type Pop = {
  id_pop: number;
  nama_pop: string;
};

type Odp = {
  id_odp: number;
  nama_odp: string;
};

type CurrentUser = {
  id_user: number;
  nama: string;
  role: string;
};

const statusBadge: Record<string, string> = {
  TERSEDIA:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  TERPASANG:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  RUSAK:
    "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
};

type Ont = {
  id_ont: number;
  serial_number: string;
  pelanggan: string;
  model: string;
  status: "TERSEDIA" | "TERPASANG" | "RUSAK";
  id_pop: number | null;
  id_odp: number | null;
  pop?: {
    nama_pop: string;
  };
  odp?: {
    nama_odp: string;
  };
  createdAt: Date;
};

const PAGE_SIZE = 10;

const MONTH_OPTIONS = [
  { key: "all", label: "Semua" },
  { key: "01", label: "Jan" },
  { key: "02", label: "Feb" },
  { key: "03", label: "Mar" },
  { key: "04", label: "Apr" },
  { key: "05", label: "Mei" },
  { key: "06", label: "Jun" },
  { key: "07", label: "Jul" },
  { key: "08", label: "Agt" },
  { key: "09", label: "Sep" },
  { key: "10", label: "Okt" },
  { key: "11", label: "Nov" },
  { key: "12", label: "Des" },
];

const STATUS_OPTIONS: {
  key: "all" | "TERSEDIA" | "TERPASANG" | "RUSAK";
  label: string;
}[] = [
  { key: "all", label: "Semua Status" },
  { key: "TERSEDIA", label: "Tersedia" },
  { key: "TERPASANG", label: "Aktif (Terpasang)" },
  { key: "RUSAK", label: "Rusak" },
];

export function OntSortableTable({
  initialData,
  pops,
  odps,
  defaultValue,
  canDelete = false,
  actions,
  currentUser,
}: {
  initialData: Ont[];
  pops: Pop[];
  odps: Odp[];
  defaultValue: string;
  canDelete?: boolean;
  actions?: ReactNode;
  currentUser?: CurrentUser;
}) {
  const router = useRouter();

  const [search, setSearch] = useState(defaultValue);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Filter navigasi
  const [filterTahun, setFilterTahun] = useState<string>("all");
  const [filterBulan, setFilterBulan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Selection state untuk bulk action
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectAllPage, setSelectAllPage] = useState(false);

  // Highlight untuk Command Palette
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const highlightHandled = useRef(false);
  const lastHighlightId = useRef<string | null>(null);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

  const isAdmin = currentUser?.role === "ADMIN";
  const isTeknisi = currentUser?.role === "TEKNISI";

  /*
   * ============================================
   * HAK AKSES ONT
   * ============================================
   *
   * TEKNISI:
   * - Tidak boleh edit
   * - Tidak boleh delete
   *
   * ADMIN:
   * - Boleh edit
   * - Boleh delete
   *
   * LOGISTIK:
   * - Boleh edit
   * - TIDAK boleh delete
   */
  const canEditOnt = !isTeknisi;

  // Hanya ADMIN yang boleh menghapus ONT
  const canDeleteOnt = isAdmin;

  // Bulk delete juga hanya ADMIN
  const canBulkDelete = isAdmin;

  /*
   * Reset selection dan kembali ke halaman 1
   * setiap kali search/filter berubah.
   */
  useEffect(() => {
    setSelectedIds(new Set());
    setSelectAllPage(false);
    setPage(1);
  }, [search, filterTahun, filterBulan, filterStatus]);

  /*
   * ============================================
   * HANDLE HIGHLIGHT DARI COMMAND PALETTE
   * ============================================
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const highlightId = params.get("highlight");

    // Reset flag jika highlight berubah
    if (highlightId !== lastHighlightId.current) {
      highlightHandled.current = false;
      lastHighlightId.current = highlightId;
    }

    if (!highlightId || highlightHandled.current) {
      return;
    }

    highlightHandled.current = true;

    const targetId = Number(highlightId);

    if (isNaN(targetId)) {
      return;
    }

    // Cari ONT yang dituju
    const item = initialData.find((ont) => ont.id_ont === targetId);

    if (!item) {
      return;
    }

    // Set search ke pelanggan
    setSearch(item.pelanggan);

    // Reset semua filter
    setFilterTahun("all");
    setFilterBulan("all");
    setFilterStatus("all");
    setPage(1);

    /*
     * Sinkronkan URL dengan state
     */
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);

      url.searchParams.set("search", item.pelanggan);
      url.searchParams.delete("highlight");
      url.searchParams.set("page", "1");

      window.history.replaceState({}, "", url.toString());
    }, 100);

    /*
     * Highlight row setelah render
     */
    setTimeout(() => {
      setHighlightedId(targetId);

      setTimeout(() => {
        const row = rowRefs.current.get(targetId);

        if (row) {
          row.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }

        setTimeout(() => {
          setHighlightedId(null);
        }, 3000);
      }, 100);
    }, 200);

    return () => clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  const getMonthLabel = (monthKey: string) =>
    MONTH_OPTIONS.find((month) => month.key === monthKey)?.label ?? "Semua";

  /*
   * Opsi tahun dibuat berdasarkan data yang tersedia
   */
  const yearOptions = useMemo(() => {
    const years = new Set<number>();

    initialData.forEach((ont) => {
      years.add(new Date(ont.createdAt).getFullYear());
    });

    return [
      "all",
      ...Array.from(years)
        .sort((a, b) => b - a)
        .map(String),
    ];
  }, [initialData]);

  /*
   * ============================================
   * FILTER DATA
   * ============================================
   */
  const filtered = useMemo(() => {
    const query = search.toLowerCase();

    return initialData.filter((ont) => {
      const matchesSearch =
        ont.serial_number.toLowerCase().includes(query) ||
        ont.pelanggan.toLowerCase().includes(query) ||
        ont.model.toLowerCase().includes(query) ||
        (ont.pop?.nama_pop?.toLowerCase().includes(query) ?? false) ||
        (ont.odp?.nama_odp?.toLowerCase().includes(query) ?? false);

      if (!matchesSearch) {
        return false;
      }

      const createdDate = new Date(ont.createdAt);

      const itemYear = String(createdDate.getFullYear());

      const itemMonth = String(createdDate.getMonth() + 1).padStart(
        2,
        "0"
      );

      const matchesTahun =
        filterTahun === "all" || itemYear === filterTahun;

      const matchesBulan =
        filterBulan === "all" || itemMonth === filterBulan;

      const matchesStatus =
        filterStatus === "all" || ont.status === filterStatus;

      return matchesTahun && matchesBulan && matchesStatus;
    });
  }, [
    initialData,
    search,
    filterTahun,
    filterBulan,
    filterStatus,
  ]);

  /*
   * ============================================
   * SORTING
   * ============================================
   */
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const result = a.serial_number.localeCompare(
        b.serial_number,
        undefined,
        {
          numeric: true,
        }
      );

      return sortOrder === "asc" ? result : -result;
    });
  }, [filtered, sortOrder]);

  const totalPagesCalc = Math.max(
    1,
    Math.ceil(sorted.length / PAGE_SIZE)
  );

  const paginated = sorted.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const hasActiveFilter =
    filterTahun !== "all" ||
    filterBulan !== "all" ||
    filterStatus !== "all";

  /*
   * ============================================
   * SELECTION
   * ============================================
   */
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
    const allSelected = paginated.every((item) =>
      selectedIds.has(item.id_ont)
    );

    if (selectAllPage && allSelected) {
      setSelectAllPage(false);

      setSelectedIds((prev) => {
        const next = new Set(prev);

        paginated.forEach((item) => {
          next.delete(item.id_ont);
        });

        return next;
      });
    } else {
      setSelectAllPage(true);

      setSelectedIds((prev) => {
        const next = new Set(prev);

        paginated.forEach((item) => {
          next.add(item.id_ont);
        });

        return next;
      });
    }
  };

  /*
   * ============================================
   * BULK EXPORT
   * ============================================
   */
  const handleBulkExport = async () => {
    const ids = Array.from(selectedIds);

    if (ids.length === 0) {
      toast.error("Pilih item yang ingin diekspor");
      return;
    }

    setIsExporting(true);

    try {
      const url =
        ids.length === sorted.length
          ? `/api/ont/export`
          : `/api/ont/export?ids=${ids.join(",")}`;

      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();

        toast.error(
          error.message || "Gagal mengekspor data"
        );

        return;
      }

      const blob = await response.blob();

      const contentDisposition =
        response.headers.get("Content-Disposition");

      const filename = contentDisposition
        ? contentDisposition
            .split("filename=")[1]
            ?.replace(/"/g, "")
        : `Export_ONT_${new Date()
            .toISOString()
            .slice(0, 10)}.xlsx`;

      const urlBlob = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = urlBlob;
      link.download = filename;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(urlBlob);

      toast.success(
        `Berhasil mengekspor ${ids.length} data ONT`
      );
    } catch (error) {
      console.error("Export error:", error);

      toast.error(
        "Terjadi kesalahan saat mengekspor data"
      );
    } finally {
      setIsExporting(false);
    }
  };

  /*
   * ============================================
   * BULK DELETE
   * ============================================
   */
  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);

    if (ids.length === 0) {
      toast.error("Pilih item yang ingin dihapus");
      return;
    }

    // Pengaman tambahan di client
    if (!canBulkDelete) {
      toast.error("Hanya Admin yang boleh menghapus ONT.");
      return;
    }

    setBulkDeleteIds(ids);
    setBulkDeleteOpen(true);
  };

  /*
   * ============================================
   * BULK PRINT LABEL
   * ============================================
   */
  const handleBulkPrintLabels = () => {
    const ids = Array.from(selectedIds);

    if (ids.length === 0) {
      toast.error("Pilih item yang ingin dicetak");
      return;
    }

    router.push(
      `/masterdata/ont/print-labels?ids=${ids.join(",")}`
    );
  };

  /*
   * ============================================
   * HANDLE DELETE SUCCESS
   * ============================================
   */
  const handleDeleteSuccess = () => {
    setSelectedIds(new Set());
    setSelectAllPage(false);
    setBulkDeleteOpen(false);
    setBulkDeleteIds([]);
    setIsBulkDeleting(false);

    router.refresh();
  };

  return (
    <Card className="rounded-3xl border shadow-xl transition-all hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <CardContent className="space-y-4 p-4 sm:p-6">

        {/* =========================================
            BULK ACTION BAR
        ========================================== */}
        {selectedIds.size > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-purple-200 bg-purple-50 p-3 dark:border-purple-500/30 dark:bg-purple-500/10 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
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
                onClick={handleBulkPrintLabels}
                className="h-9 rounded-xl text-purple-600 hover:bg-purple-50 hover:text-purple-700 dark:text-purple-400 dark:hover:bg-purple-500/10"
              >
                <Printer className="mr-1.5 h-4 w-4" />

                Cetak Label QR
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedIds(new Set());
                  setSelectAllPage(false);
                }}
                className="h-9 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="mr-1.5 h-4 w-4" />

                Batal
              </Button>
            </div>
          </div>
        )}

        {/* =========================================
            BARIS 1
        ========================================== */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <OntSearch
            value={search}
            onChange={setSearch}
          />

          <div className="flex items-center gap-2">
            {actions}

            <OntFormDialog
              mode="create"
              pops={pops}
              odps={odps}
            />
          </div>
        </div>

        {/* =========================================
            BARIS 2 - FILTER
        ========================================== */}
        <div className="flex flex-wrap items-center gap-2 overflow-visible">

          {/* FILTER TAHUN */}
          <div className="flex items-center gap-2">
            <Select
              value={filterTahun}
              onValueChange={(value) => {
                if (value) {
                  setFilterTahun(value);
                  setPage(1);
                }
              }}
            >
              <SelectTrigger className="h-11 w-[130px] rounded-2xl border-slate-200 bg-white shadow-sm transition-colors hover:border-purple-300 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700">
                <Calendar className="mr-2 h-4 w-4 shrink-0 text-purple-500" />

                <SelectValue>
                  {filterTahun === "all" ? (
                    <span>Semua Thn</span>
                  ) : (
                    <span>{filterTahun}</span>
                  )}
                </SelectValue>
              </SelectTrigger>

              <SelectContent
                side="bottom"
                alignItemWithTrigger={false}
                className="z-[100] max-h-64 overflow-y-auto rounded-2xl border border-slate-200 p-1.5 shadow-lg dark:border-slate-700"
              >
                {yearOptions.map((year) => (
                  <SelectItem
                    key={year}
                    value={year}
                    className="cursor-pointer gap-2 rounded-xl py-2.5 focus:bg-purple-50 dark:focus:bg-purple-500/10"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                      <span>
                        {year === "all" ? "Semua" : year}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filterTahun !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterTahun("all");
                  setPage(1);
                }}
                className="h-11 w-11 rounded-2xl border border-slate-200 p-0 dark:border-slate-700"
              >
                <X className="h-4 w-4 text-slate-500" />
              </Button>
            )}
          </div>

          {/* FILTER BULAN */}
          <div className="flex items-center gap-2">
            <Select
              value={filterBulan}
              onValueChange={(value) => {
                if (value) {
                  setFilterBulan(value);
                  setPage(1);
                }
              }}
            >
              <SelectTrigger className="h-11 w-[110px] rounded-2xl border-slate-200 bg-white shadow-sm transition-colors hover:border-purple-300 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700">
                <Calendar className="mr-2 h-4 w-4 shrink-0 text-purple-500" />

                <SelectValue>
                  {filterBulan === "all" ? (
                    <span>Semua</span>
                  ) : (
                    <span>{getMonthLabel(filterBulan)}</span>
                  )}
                </SelectValue>
              </SelectTrigger>

              <SelectContent
                side="bottom"
                alignItemWithTrigger={false}
                className="z-[100] max-h-64 overflow-y-auto rounded-2xl border border-slate-200 p-1.5 shadow-lg dark:border-slate-700"
              >
                {MONTH_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.key}
                    value={opt.key}
                    className="cursor-pointer gap-2 rounded-xl py-2.5 focus:bg-purple-50 dark:focus:bg-purple-500/10"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                      <span>
                        {opt.key === "all"
                          ? "Semua"
                          : opt.label}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filterBulan !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterBulan("all");
                  setPage(1);
                }}
                className="h-11 w-11 rounded-2xl border border-slate-200 p-0 dark:border-slate-700"
              >
                <X className="h-4 w-4 text-slate-500" />
              </Button>
            )}
          </div>

          {/* FILTER STATUS */}
          <div className="flex items-center gap-2">
            <Select
              value={filterStatus}
              onValueChange={(value) => {
                if (value) {
                  setFilterStatus(value);
                  setPage(1);
                }
              }}
            >
              <SelectTrigger className="h-11 w-[190px] rounded-2xl border-slate-200 bg-white shadow-sm transition-colors hover:border-purple-300 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700">
                <Filter className="mr-2 h-4 w-4 shrink-0 text-purple-500" />

                <SelectValue>
                  {STATUS_OPTIONS.find(
                    (status) => status.key === filterStatus
                  )?.label ?? "Semua Status"}
                </SelectValue>
              </SelectTrigger>

              <SelectContent
                side="bottom"
                alignItemWithTrigger={false}
                className="z-[100] max-h-64 overflow-y-auto rounded-2xl border border-slate-200 p-1.5 shadow-lg dark:border-slate-700"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.key}
                    value={opt.key}
                    className="cursor-pointer gap-2 rounded-xl py-2.5 focus:bg-purple-50 dark:focus:bg-purple-500/10"
                  >
                    <span className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                      <span>{opt.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filterStatus !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterStatus("all");
                  setPage(1);
                }}
                className="h-11 w-11 rounded-2xl border border-slate-200 p-0 dark:border-slate-700"
              >
                <X className="h-4 w-4 text-slate-500" />
              </Button>
            )}
          </div>
        </div>

        {/* =========================================
            DESKTOP TABLE
        ========================================== */}
        <div className="table-container hidden overflow-x-auto rounded-2xl border dark:border-slate-800 md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <TableHead className="w-12 text-center dark:text-slate-300">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="inline-flex items-center justify-center"
                    title={
                      selectAllPage
                        ? "Batalkan pilih semua halaman ini"
                        : "Pilih semua halaman ini"
                    }
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border-2 transition-colors",
                        paginated.length > 0 &&
                          paginated.every((item) =>
                            selectedIds.has(item.id_ont)
                          )
                          ? "border-purple-500 bg-purple-500"
                          : "border-slate-300 hover:border-purple-400 dark:border-slate-600"
                      )}
                    >
                      {paginated.length > 0 &&
                        paginated.every((item) =>
                          selectedIds.has(item.id_ont)
                        ) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                    </div>
                  </button>
                </TableHead>

                <TableHead className="dark:text-slate-300">
                  <button
                    type="button"
                    onClick={toggleSort}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-purple-600"
                  >
                    Serial Number

                    {sortOrder === "asc" ? (
                      <ArrowUp
                        size={16}
                        className="text-purple-500"
                      />
                    ) : (
                      <ArrowDown
                        size={16}
                        className="text-purple-500"
                      />
                    )}
                  </button>
                </TableHead>

                <TableHead className="dark:text-slate-300">
                  Model
                </TableHead>

                <TableHead className="dark:text-slate-300">
                  Pelanggan
                </TableHead>

                <TableHead className="dark:text-slate-300">
                  Status
                </TableHead>

                <TableHead className="dark:text-slate-300">
                  POP
                </TableHead>

                <TableHead className="dark:text-slate-300">
                  ODP
                </TableHead>

                <TableHead className="dark:text-slate-300">
                  Dibuat
                </TableHead>

                <TableHead className="text-center dark:text-slate-300">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-10 text-center text-slate-400 dark:text-slate-500"
                  >
                    {search || hasActiveFilter
                      ? "Tidak ada data ONT yang cocok"
                      : "Belum ada data ONT"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((ont) => (
                  <TableRow
                    key={ont.id_ont}
                    ref={(el) => {
                      if (el) {
                        rowRefs.current.set(ont.id_ont, el);
                      } else {
                        rowRefs.current.delete(ont.id_ont);
                      }
                    }}
                    className={cn(
                      "border-b border-slate-200 transition-colors",
                      selectedIds.has(ont.id_ont)
                        ? "bg-purple-50 dark:bg-purple-500/10"
                        : "hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50",
                      highlightedId === ont.id_ont &&
                        "bg-yellow-100 ring-2 ring-yellow-400 dark:bg-yellow-500/20 dark:ring-yellow-500"
                    )}
                  >
                    <TableCell
                      className="text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(ont.id_ont);
                        }}
                        className="inline-flex items-center justify-center"
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border-2 transition-colors",
                            selectedIds.has(ont.id_ont)
                              ? "border-purple-500 bg-purple-500"
                              : "border-slate-300 hover:border-purple-400 dark:border-slate-600"
                          )}
                        >
                          {selectedIds.has(ont.id_ont) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </button>
                    </TableCell>

                    <TableCell
                      className="font-medium dark:text-slate-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ont.serial_number}
                    </TableCell>

                    <TableCell
                      className="dark:text-slate-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ont.model || "-"}
                    </TableCell>

                    <TableCell
                      className="dark:text-slate-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ont.pelanggan || (
                        <span className="italic text-slate-400">
                          Belum terpasang
                        </span>
                      )}
                    </TableCell>

                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium",
                          statusBadge[ont.status]
                        )}
                      >
                        {ont.status}
                      </span>
                    </TableCell>

                    <TableCell
                      className="dark:text-slate-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ont.pop?.nama_pop || "-"}
                    </TableCell>

                    <TableCell
                      className="dark:text-slate-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ont.odp?.nama_odp || "-"}
                    </TableCell>

                    <TableCell
                      className="text-slate-500 dark:text-slate-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {new Date(
                        ont.createdAt
                      ).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>

                    <TableCell
                      className="text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-center gap-1">
                        <OntQrDialog
                          ont={{
                            id_ont: ont.id_ont,
                            serial_number: ont.serial_number,
                            pelanggan: ont.pelanggan,
                            status: ont.status,
                          }}
                        />

                        {canEditOnt && (
                          <OntFormDialog
                            mode="edit"
                            pops={pops}
                            odps={odps}
                            data={{
                              id_ont: ont.id_ont,
                              serial_number: ont.serial_number,
                              pelanggan: ont.pelanggan,
                              model: ont.model,
                              status: ont.status,
                              id_pop: ont.id_pop,
                              id_odp: ont.id_odp,
                            }}
                          />
                        )}

                        {canDeleteOnt && (
                          <DeleteOntDialog
                            id={ont.id_ont}
                            name={ont.serial_number ?? ""}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* =========================================
            MOBILE CARDS
        ========================================== */}
        <div className="grid gap-3 md:hidden">
          {paginated.map((ont) => (
            <div
              key={ont.id_ont}
              className={cn(
                "space-y-2 rounded-2xl border p-4 dark:border-slate-800 dark:bg-slate-800/40",
                selectedIds.has(ont.id_ont) &&
                  "border-purple-300 bg-purple-50 dark:bg-purple-500/10"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => toggleSelect(ont.id_ont)}
                  className="flex items-center gap-3"
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                      selectedIds.has(ont.id_ont)
                        ? "border-purple-500 bg-purple-500"
                        : "border-slate-300 hover:border-purple-400 dark:border-slate-600"
                    )}
                  >
                    {selectedIds.has(ont.id_ont) && (
                      <Check className="h-3.5 w-3.5 text-white" />
                    )}
                  </div>

                  <div className="text-left">
                    <p className="font-semibold dark:text-slate-100">
                      {ont.serial_number}
                    </p>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {ont.model || "-"}
                    </p>

                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {ont.pelanggan || (
                        <span className="italic">
                          Belum terpasang
                        </span>
                      )}
                    </p>
                  </div>
                </button>

                <div className="flex shrink-0 gap-1">
                  <OntQrDialog
                    ont={{
                      id_ont: ont.id_ont,
                      serial_number: ont.serial_number,
                      pelanggan: ont.pelanggan,
                      status: ont.status,
                    }}
                  />

                  {canEditOnt && (
                    <OntFormDialog
                      mode="edit"
                      pops={pops}
                      odps={odps}
                      data={{
                        id_ont: ont.id_ont,
                        serial_number: ont.serial_number,
                        pelanggan: ont.pelanggan,
                        model: ont.model,
                        status: ont.status,
                        id_pop: ont.id_pop,
                        id_odp: ont.id_odp,
                      }}
                    />
                  )}

                  {canDeleteOnt && (
                    <DeleteOntDialog
                      id={ont.id_ont}
                      name={ont.serial_number ?? ""}
                    />
                  )}
                </div>
              </div>

              <span
                className={cn(
                  "inline-block rounded-full px-3 py-1 text-xs font-medium",
                  statusBadge[ont.status]
                )}
              >
                {ont.status}
              </span>
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        <div className="flex justify-end">
          <OntPagination
            page={page}
            totalPages={totalPagesCalc}
          />
        </div>
      </CardContent>

      {/* BULK DELETE DIALOG */}
      {bulkDeleteOpen && bulkDeleteIds.length > 0 && (
        <DeleteOntDialog
          id={bulkDeleteIds[0]}
          name={`${bulkDeleteIds.length} ONT`}
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