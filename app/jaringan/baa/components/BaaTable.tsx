"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  ClipboardList,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  Loader2,
  UserRound,
  Calendar,
  Router,
  GitBranch,
  Trash,
  Download,
  Check,
  Package,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BaaDialog } from "@/app/jaringan/baa/components/BaaDialog";
import { BaaDeleteDialog } from "@/app/jaringan/baa/components/BaaDeleteDialog";
import { BaaImageDialog } from "@/app/jaringan/baa/components/BaaImageDialog";
import { BaaPagination } from "@/app/jaringan/baa/components/BaaPagination";
import { BaaExportButton } from "@/app/jaringan/baa/components/BaaExportButton";
import { PageSizeSelector } from "@/components/ui/page-size-selector";
import { toast } from "sonner";
import type {
  BaaData,
  StatusBaa,
  FabOption,
  TeknisiOption,
  OltOption,
  OdpOption,
  OntOption,
  MaterialOption,
  CurrentUser,
} from "@/types/baa";

interface BaaTableProps {
  data: BaaData[];
  fabOptions: FabOption[];
  teknisiOptions: TeknisiOption[];
  oltOptions: OltOption[];
  odpOptions: OdpOption[];
  ontOptions: OntOption[];
  materialOptions: MaterialOption[];
  currentUser: CurrentUser;
  kodeOtomatis: string;
  allTeknisiOptions?: TeknisiOption[]; // Semua teknisi untuk filter (admin/leader)
}

const PAGE_SIZE = 5;

const STATUS_LABEL: Record<StatusBaa, string> = {
  SELESAI: "Selesai",
};

// ================== SKELETON ROW COMPONENTS ==================

function SkeletonRow({ colCount = 18 }: { colCount?: number }) {
  return (
    <TableRow className="border-b border-slate-200 dark:border-slate-800">
      {Array.from({ length: colCount }).map((_, i) => (
        <TableCell key={i} className="py-4">
          <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </TableCell>
      ))}
    </TableRow>
  );
}

function formatTanggal(date: Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ================== MATERIAL DETAIL DIALOG ==================

interface MaterialDetailDialogProps {
  baadetail?: Array<{
    id_material?: number;
    jumlah?: number;
    keterangan?: string | null;
    material?: {
      nama_material?: string;
      kode_material?: string;
      satuan?: string;
    } | null;
  }> | null;
}

function MaterialDetailDialog({ baadetail }: MaterialDetailDialogProps) {
  const [open, setOpen] = useState(false);

  if (!baadetail || baadetail.length === 0) {
    return <span className="text-slate-400 dark:text-slate-500 text-xs">-</span>;
  }

  const totalItems = baadetail.reduce((sum, d) => sum + (d.jumlah || 0), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm font-medium text-slate-600 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-purple-600 dark:hover:bg-purple-500/20 dark:hover:text-purple-400"
      >
        <Package size={14} />
        <span>{baadetail.length} item</span>
      </button>

      <DialogContent className="sm:max-w-md rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-500" />
            Material yang Digunakan
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {baadetail.map((detail, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {detail.material?.nama_material || "Material tidak ditemukan"}
                </p>
                <p className="text-xs text-slate-400">
                  {detail.material?.kode_material || "-"}
                  {detail.keterangan && ` • ${detail.keterangan}`}
                </p>
              </div>
              <div className="ml-3 flex-shrink-0 rounded-lg bg-purple-100 px-2.5 py-1 dark:bg-purple-500/20">
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {detail.jumlah} {detail.material?.satuan || "unit"}
                </span>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-xl border-2 border-purple-200 bg-purple-50 p-3 dark:border-purple-500/30 dark:bg-purple-500/10">
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              Total Material
            </span>
            <span className="text-base font-bold text-purple-600 dark:text-purple-400">
              {totalItems} unit
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BaaActionMenu({
  item,
  onEdit,
  onDelete,
  triggerClassName,
  currentUser,
}: {
  item: BaaData;
  onEdit: (item: BaaData) => void;
  onDelete: (item: BaaData) => void;
  triggerClassName: string;
  currentUser: CurrentUser;
}) {
  const isAdmin = currentUser.role === "ADMIN";
  const isOwner = currentUser.id_user === item.id_user;

  const canDelete = isAdmin;
  const canEdit = isAdmin || isOwner;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), triggerClassName, "active:scale-90 transition-transform")}
          />
        }
      >
        <MoreVertical className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 rounded-2xl border border-slate-200/70 bg-white/95 p-1.5 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95 dark:shadow-black/30"
      >
        <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Navigasi
        </p>

        <DropdownMenuItem className="rounded-xl p-0 cursor-pointer focus:bg-gradient-to-r focus:from-purple-50 focus:to-fuchsia-50 dark:focus:from-purple-500/10 dark:focus:to-fuchsia-500/10">
          <Link
            href={`/workspace?view=baa&id_baa=${item.id_baa}`}
            className="flex w-full items-center gap-3 px-2.5 py-2"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-sm shadow-purple-300/50">
              <ClipboardList className="h-4 w-4 text-white" />
            </span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Detail &amp; Material</span>
          </Link>
        </DropdownMenuItem>

        {(canEdit || canDelete) && (
          <>
            <div className="my-1.5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
            <p className="px-2.5 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Aksi
            </p>
          </>
        )}

        {canEdit && (
          <DropdownMenuItem
            onClick={() => onEdit(item)}
            className="rounded-xl gap-3 px-2.5 py-2 cursor-pointer focus:bg-orange-50 dark:focus:bg-orange-500/10"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20">
              <Pencil className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            </span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Edit BAA</span>
          </DropdownMenuItem>
        )}

        {canDelete && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(item)}
            className="rounded-xl gap-3 px-2.5 py-2 cursor-pointer dark:focus:bg-red-500/10"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/20">
              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
            </span>
            <span className="text-sm font-semibold text-red-600 dark:text-red-400">Hapus BAA</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const BaaTable = ({
  data,
  fabOptions,
  teknisiOptions,
  oltOptions,
  odpOptions,
  ontOptions,
  materialOptions,
  currentUser,
  kodeOtomatis,
  allTeknisiOptions = [],
}: BaaTableProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(false);

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

  // Handle highlight dari Command Palette (query param: highlight=<id_baa>)
  useEffect(() => {
    const highlightId = searchParams.get("highlight");

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
    const item = data.find((b) => b.id_baa === targetId);
    if (!item) return;

    // Set search ke nama pelanggan FAB dan reset filters
    setSearch(item.fab?.nama_pelanggan || "");
    setFilterTeknisi("all");
    setFilterTahun("all");
    setFilterBulan("all");
    setFilterOlt("all");
    setFilterOdp("all");
    setPage(1);

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

    // Hapus highlight param dari URL
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("highlight");
      window.history.replaceState({}, "", url.toString());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchParams, data]);

  // Detect when navigation happens (e.g., after router.refresh())
  useEffect(() => {
    setIsLoading(true);
    // Small delay to prevent flicker for fast operations
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [searchParams.toString(), pathname]);

  // Toggle single item selection
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

  // Toggle all visible items (per page)
  const toggleSelectAll = () => {
    const allSelected = paginated.every((item) => selectedIds.has(item.id_baa));
    if (selectAllPage && allSelected) {
      // Uncheck all on current page only
      setSelectAllPage(false);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((item) => next.delete(item.id_baa));
        return next;
      });
    } else {
      // Select all on current page and enable auto-select mode
      setSelectAllPage(true);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((item) => next.add(item.id_baa));
        return next;
      });
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

  // Bulk export handler
  const handleBulkExport = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.error("Pilih item yang ingin diekspor");
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch(`/api/baa/export?ids=${ids.join(",")}`);

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Gagal mengekspor data");
        return;
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `Export_BAA_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlBlob;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);

      toast.success(`Berhasil mengekspor ${ids.length} data BAA`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Terjadi kesalahan saat mengekspor data");
    } finally {
      setIsExporting(false);
    }
  };

  // Handle delete success
  const handleDeleteSuccess = () => {
    setSelectedIds(new Set());
    setSelectAllPage(false);
    setBulkDeleteOpen(false);
    setBulkDeleteIds([]);
  };

  // Untuk TEKNISI, default filter ke diri sendiri
  const isTeknisi = currentUser.role === "TEKNISI";

  // Lazy initialization untuk filter - hitung nilai default sekali saat mount
  const [filterTeknisi, setFilterTeknisi] = useState<string>(() => {
    return isTeknisi ? String(currentUser.id_user) : "all";
  });

  // Filter bulan, OLT, ODP
  const getCurrentYear = () => new Date().getFullYear();
  const getCurrentMonth = () => String(new Date().getMonth() + 1).padStart(2, "0");

  const getMonthName = (monthKey: string) => {
    if (monthKey === "all") return "Semua";
    const date = new Date(2024, parseInt(monthKey) - 1);
    return date.toLocaleDateString("id-ID", { month: "short" });
  };

  const getYearLabel = (year: string) => {
    if (year === "all") return "Semua Tahun";
    return year;
  };

  const [filterTahun, setFilterTahun] = useState<string>(() => String(getCurrentYear()));
  const [filterBulan, setFilterBulan] = useState<string>(() => getCurrentMonth());
  const [filterOlt, setFilterOlt] = useState<string>("all");
  const [filterOdp, setFilterOdp] = useState<string>("all");

  // Clear selection when filters/search change
  useEffect(() => {
    setSelectedIds(new Set());
    setSelectAllPage(false);
  }, [search, filterTeknisi, filterTahun, filterBulan, filterOlt, filterOdp]);

  // Generate year options (current year - 2 to current year)
  const yearOptions = useMemo(() => {
    const current = getCurrentYear();
    return ["all", String(current - 2), String(current - 1), String(current)];
  }, []);

  // Month options
  const monthOptions = [
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

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  const [editItem, setEditItem] = useState<BaaData | null>(null);
  const [deleteItem, setDeleteItem] = useState<BaaData | null>(null);

  // Hanya Admin, Teknisi, dan Leader yang boleh menambah BAA baru -- Sales tidak.
  const canCreate = ["ADMIN", "TEKNISI", "LEADER"].includes(currentUser.role);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const result = a.kode_baa.localeCompare(b.kode_baa, undefined, { numeric: true });
      return sortOrder === "asc" ? result : -result;
    });
  }, [data, sortOrder]);

  const filtered = useMemo(() => {
    return sortedData.filter((item) => {
      // Filter search
      const matchesSearch =
        item.kode_baa.toLowerCase().includes(search.toLowerCase()) ||
        (item.fab?.nama_pelanggan ?? "").toLowerCase().includes(search.toLowerCase());

      // Filter berdasarkan teknisi - cek teknisi utama atau teknisi tambahan
      const teknisiId = item.users?.id_user;
      const isInTeknisiTambahan = item.teknisiTambahan?.some(
        (tk) => tk.users?.id_user === Number(filterTeknisi)
      );
      const matchesTeknisi =
        filterTeknisi === "all" ||
        teknisiId === Number(filterTeknisi) ||
        isInTeknisiTambahan;

      // Filter berdasarkan tahun dan bulan
      const itemDate = new Date(item.tanggal_instalasi);
      const itemYear = String(itemDate.getFullYear());
      const itemMonth = String(itemDate.getMonth() + 1).padStart(2, "0");
      const matchesTahun = filterTahun === "all" || itemYear === filterTahun;
      const matchesBulan = filterBulan === "all" || itemMonth === filterBulan;

      // Filter berdasarkan OLT
      const matchesOlt = filterOlt === "all" || item.olt?.id_olt === Number(filterOlt);

      // Filter berdasarkan ODP
      const matchesOdp = filterOdp === "all" || item.odp?.id_odp === Number(filterOdp);

      return matchesSearch && matchesTeknisi && matchesTahun && matchesBulan && matchesOlt && matchesOdp;
    });
  }, [sortedData, search, filterTeknisi, filterTahun, filterBulan, filterOlt, filterOdp]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Selection persists across pages but does NOT auto-select on page change

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (value: string | null) => {
    setFilterTeknisi(value ?? "all");
    setPage(1);
  };

  const clearFilter = () => {
    setFilterTeknisi("all");
    setPage(1);
  };

  const clearBulanFilter = () => {
    setFilterBulan("all");
    setPage(1);
  };

  const clearTahunFilter = () => {
    setFilterTahun("all");
    setPage(1);
  };

  const clearOltFilter = () => {
    setFilterOlt("all");
    setPage(1);
  };

  const clearOdpFilter = () => {
    setFilterOdp("all");
    setPage(1);
  };

  const showFilterDropdown = isTeknisi || allTeknisiOptions.length > 0;

  return (
    <Card className="rounded-3xl border shadow-xl transition-all hover:shadow-2xl dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
      <div className="space-y-4 p-4 sm:p-6">
        {/* Bulk Action Bar - muncul saat ada item terpilih */}
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
              {currentUser.role === "ADMIN" && (
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

        {/* Baris 1: Search (kiri) + Sort mobile & Export & Tambah (kanan) */}
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div className="relative w-full max-w-xs">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
    <Input
      type="text"
      placeholder="Cari kode BAA / nama pelanggan..."
      value={search}
      onChange={(e) => handleSearchChange(e.target.value)}
      className="h-11 rounded-2xl border-slate-200 pl-11 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
    />
  </div>

  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
    <button
      type="button"
      onClick={toggleSort}
      className="md:hidden inline-flex h-11 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/70"
    >
      {sortOrder === "asc" ? (
        <ArrowUp size={16} className="text-purple-500" />
      ) : (
        <ArrowDown size={16} className="text-purple-500" />
      )}
      <span>{sortOrder === "asc" ? "Terlama" : "Terbaru"}</span>
    </button>

    {(currentUser.role === "ADMIN" || currentUser.role === "LEADER") && <BaaExportButton />}
    {canCreate && (
      <BaaDialog
        mode="create"
        kodeOtomatis={kodeOtomatis}
        fabOptions={fabOptions}
        teknisiOptions={teknisiOptions}
        oltOptions={oltOptions}
        odpOptions={odpOptions}
        ontOptions={ontOptions}
        materialOptions={materialOptions}
        currentUser={currentUser}
      />
    )}
  </div>
</div>

        {/* Baris 2: Filter Teknisi + Filter Bulan + Filter OLT + Filter ODP + Page Size Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Dropdown Teknisi - hanya tampil jika ada opsi atau role teknisi */}
          {showFilterDropdown && (
            <div className="flex items-center gap-2">
              <Select value={filterTeknisi} onValueChange={handleFilterChange}>
                <SelectTrigger className="h-11 w-[190px] rounded-2xl border-slate-200 bg-white shadow-sm transition-colors hover:border-purple-300 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700">
                  <Filter className="h-4 w-4 mr-2 text-purple-500 shrink-0" />
                  <SelectValue placeholder="Filter teknisi">
                    {(value: string) => {
                      if (value === "all") return "Semua";
                      if (isTeknisi && value === String(currentUser.id_user)) {
                        return `Saya (${currentUser.nama})`;
                      }
                      const opt = allTeknisiOptions.find((o) => String(o.id_user) === value);
                      return opt?.nama ?? "Filter teknisi";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 p-1.5 shadow-lg dark:border-slate-700">
                  {isTeknisi && (
                    <SelectItem
                      value={String(currentUser.id_user)}
                      className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10"
                    >
                      <UserRound className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                      <span className="font-medium">Saya ({currentUser.nama})</span>
                    </SelectItem>
                  )}
                  <SelectItem
                    value="all"
                    className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10"
                  >
                    <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Semua</span>
                  </SelectItem>
                  {allTeknisiOptions.map((opt) => (
                    <SelectItem
                      key={opt.id_user}
                      value={String(opt.id_user)}
                      className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10"
                    >
                      <UserRound className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{opt.nama}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear filter button */}
              {filterTeknisi !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilter}
                  className="h-11 w-11 p-0 rounded-2xl border border-slate-200 dark:border-slate-700"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </Button>
              )}
            </div>
          )}

          {/* Filter Dropdown Tahun */}
          <Select value={filterTahun} onValueChange={(value) => { if (value) { setFilterTahun(value); setPage(1); } }}>
            <SelectTrigger className="h-11 w-[130px] rounded-2xl border-slate-200 bg-white shadow-sm transition-colors hover:border-purple-300 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700">
              <Calendar className="h-4 w-4 mr-2 text-purple-500 shrink-0" />
              <SelectValue>
                {filterTahun === "all" ? (<span>Semua Thn</span>) : (<span>{filterTahun}</span>)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" alignItemWithTrigger={false} className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 p-1.5 shadow-lg dark:border-slate-700 z-[100]">
  {yearOptions.map((year) => (<SelectItem key={year} value={year} className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10"><span className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" /><span>{year === "all" ? "Semua" : year}</span></span></SelectItem>))}
</SelectContent>
          </Select>

          {/* Filter Dropdown Bulan */}
          <Select value={filterBulan} onValueChange={(value) => { if (value) { setFilterBulan(value); setPage(1); } }}>
            <SelectTrigger className="h-11 w-[110px] rounded-2xl border-slate-200 bg-white shadow-sm transition-colors hover:border-purple-300 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700">
              <Calendar className="h-4 w-4 mr-2 text-purple-500 shrink-0" />
              <SelectValue>
                {filterBulan === "all" ? (<span>Semua</span>) : (<span>{getMonthName(filterBulan)}</span>)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" alignItemWithTrigger={false} className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 p-1.5 shadow-lg dark:border-slate-700 z-[100]">
  {monthOptions.map((opt) => (
                <SelectItem key={opt.key} value={opt.key} className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{opt.key === "all" ? "Semua" : opt.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Dropdown OLT */}
          <Select value={filterOlt} onValueChange={(value) => { if (value) { setFilterOlt(value); setPage(1); } }}>
            <SelectTrigger className="h-11 w-[150px] rounded-2xl border-slate-200 bg-white shadow-sm transition-colors hover:border-purple-300 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700">
              <Router className="h-4 w-4 mr-2 text-purple-500 shrink-0" />
              <SelectValue placeholder="Filter OLT">
                {filterOlt !== "all" ? oltOptions.find(o => String(o.id_olt) === filterOlt)?.nama_olt : "Semua OLT"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 p-1.5 shadow-lg dark:border-slate-700 z-[100]">
              <SelectItem value="all" className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10">
                <Router className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Semua OLT</span>
              </SelectItem>
              {oltOptions.map((opt) => (
                <SelectItem key={opt.id_olt} value={String(opt.id_olt)} className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10">
                  <Router className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{opt.nama_olt}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filterOlt !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearOltFilter}
              className="h-11 w-11 p-0 rounded-2xl border border-slate-200 dark:border-slate-700"
            >
              <X className="h-4 w-4 text-slate-500" />
            </Button>
          )}

          {/* Filter Dropdown ODP */}
          <Select value={filterOdp} onValueChange={(value) => { if (value) { setFilterOdp(value); setPage(1); } }}>
            <SelectTrigger className="h-11 w-[150px] rounded-2xl border-slate-200 bg-white shadow-sm transition-colors hover:border-purple-300 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700">
              <GitBranch className="h-4 w-4 mr-2 text-purple-500 shrink-0" />
              <SelectValue placeholder="Filter ODP">
                {filterOdp !== "all" ? odpOptions.find(o => String(o.id_odp) === filterOdp)?.nama_odp : "Semua ODP"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 p-1.5 shadow-lg dark:border-slate-700 z-[100]">
              <SelectItem value="all" className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10">
                <GitBranch className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Semua ODP</span>
              </SelectItem>
              {odpOptions.map((opt) => (
                <SelectItem key={opt.id_odp} value={String(opt.id_odp)} className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10">
                  <GitBranch className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{opt.nama_odp}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filterOdp !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearOdpFilter}
              className="h-11 w-11 p-0 rounded-2xl border border-slate-200 dark:border-slate-700"
            >
              <X className="h-4 w-4 text-slate-500" />
            </Button>
          )}

          {/* Page Size Selector */}
          <PageSizeSelector
            value={pageSize}
            onValueChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>

        {/* ====================================================== */}
        {/* Versi Tabel - hanya muncul di layar medium ke atas (md:) */}
        {/* ====================================================== */}
        <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 md:block">
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
                        paginated.length > 0 && paginated.every((item) => selectedIds.has(item.id_baa))
                          ? "border-purple-500 bg-purple-500"
                          : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                      }`}
                    >
                      {paginated.length > 0 && paginated.every((item) => selectedIds.has(item.id_baa)) && (
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
                <TableHead className="text-center dark:text-slate-300">Foto</TableHead>
                <TableHead className="dark:text-slate-300">Tanggal Instalasi</TableHead>
                <TableHead className="dark:text-slate-300">FAB / Pelanggan</TableHead>
                <TableHead className="dark:text-slate-300">Teknisi</TableHead>
                <TableHead className="dark:text-slate-300">OLT</TableHead>
                <TableHead className="dark:text-slate-300">ODP</TableHead>
                <TableHead className="dark:text-slate-300">ONT</TableHead>
                <TableHead className="text-center dark:text-slate-300">Port OLT</TableHead>
                <TableHead className="text-center dark:text-slate-300">Port ODP</TableHead>
                <TableHead className="text-center dark:text-slate-300">RX Power</TableHead>
                <TableHead className="text-center dark:text-slate-300">TX Power</TableHead>
                <TableHead className="dark:text-slate-300">Speed ↓</TableHead>
                <TableHead className="dark:text-slate-300">Speed ↑</TableHead>
                <TableHead className="text-center dark:text-slate-300">Ping</TableHead>
                <TableHead className="dark:text-slate-300">Catatan</TableHead>
                <TableHead className="text-center dark:text-slate-300">
                  <span title="Klik untuk lihat detail material">Material</span>
                </TableHead>
                <TableHead className="text-center dark:text-slate-300">Status</TableHead>
                <TableHead className="text-right dark:text-slate-300">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton loading rows
                <>
                  <SkeletonRow colCount={19} />
                  <SkeletonRow colCount={19} />
                  <SkeletonRow colCount={19} />
                  <SkeletonRow colCount={19} />
                  <SkeletonRow colCount={19} />
                </>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={19} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {search ? "Tidak ada data BAA yang cocok dengan pencarian" : "Belum ada data BAA"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((item) => (
                  <TableRow
                    key={item.id_baa}
                    ref={(el) => {
                      if (el) rowRefs.current.set(item.id_baa, el);
                      else rowRefs.current.delete(item.id_baa);
                    }}
                    className={cn(
                      "border-b border-slate-200 dark:border-slate-800 transition-colors cursor-pointer",
                      selectedIds.has(item.id_baa)
                        ? "bg-purple-50 dark:bg-purple-500/10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                      highlightedId === item.id_baa && "bg-yellow-100 dark:bg-yellow-500/20 ring-2 ring-yellow-400 dark:ring-yellow-500"
                    )}
                    onDoubleClick={() => router.push(`/workspace?view=baa&id_baa=${item.id_baa}`)}
                  >
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(item.id_baa);
                        }}
                        className="inline-flex items-center justify-center"
                      >
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                            selectedIds.has(item.id_baa)
                              ? "border-purple-500 bg-purple-500"
                              : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                          }`}
                        >
                          {selectedIds.has(item.id_baa) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="font-medium dark:text-slate-200" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/workspace?view=baa&id_baa=${item.id_baa}`}
                        className="hover:text-purple-600 hover:underline transition-colors"
                      >
                        {item.kode_baa}
                      </Link>
                    </TableCell>

                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <BaaImageDialog fotoUrl={item.foto_instalasi} kodeBaa={item.kode_baa} />
                    </TableCell>

                    <TableCell className="text-slate-500 whitespace-nowrap dark:text-slate-400">{formatTanggal(item.tanggal_instalasi)}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap dark:text-slate-200">{item.fab?.nama_pelanggan ?? "-"}</TableCell>
                    <TableCell className="whitespace-nowrap dark:text-slate-300">{item.users?.nama ?? "-"}</TableCell>
                    <TableCell className="whitespace-nowrap dark:text-slate-300">{item.olt?.nama_olt ?? "-"}</TableCell>
                    <TableCell className="whitespace-nowrap dark:text-slate-300">{item.odp?.nama_odp ?? "-"}</TableCell>
                    <TableCell className="whitespace-nowrap dark:text-slate-300">{item.ont?.serial_number ?? "-"}</TableCell>
                    <TableCell className="text-center dark:text-slate-300">{item.port_olt ?? "-"}</TableCell>
                    <TableCell className="text-center dark:text-slate-300">{item.port_odp ?? "-"}</TableCell>
                    <TableCell className="text-center whitespace-nowrap dark:text-slate-300">{item.rx_power_dbm !== null ? `${item.rx_power_dbm} dBm` : "-"}</TableCell>
                    <TableCell className="text-center whitespace-nowrap dark:text-slate-300">{item.tx_power_dbm !== null ? `${item.tx_power_dbm} dBm` : "-"}</TableCell>
                    <TableCell className="whitespace-nowrap dark:text-slate-300">{item.speed_download ?? "-"}</TableCell>
                    <TableCell className="whitespace-nowrap dark:text-slate-300">{item.speed_upload ?? "-"}</TableCell>
                    <TableCell className="text-center whitespace-nowrap dark:text-slate-300">{item.ping_ms !== null ? `${item.ping_ms} ms` : "-"}</TableCell>
                    <TableCell className="max-w-[160px] truncate text-slate-500 dark:text-slate-400">
                      <span title={item.catatan ?? undefined}>{item.catatan || "-"}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <MaterialDetailDialog baadetail={item.baadetail} />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {STATUS_LABEL[item.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <BaaActionMenu
                        item={item}
                        onEdit={setEditItem}
                        onDelete={setDeleteItem}
                        triggerClassName="h-8 w-8 p-0"
                        currentUser={currentUser}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ====================================================== */}
        {/* Versi Card - hanya muncul di HP (di bawah breakpoint md:) */}
        {/* ====================================================== */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : (
        <div className="grid gap-3 md:hidden">
          {paginated.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 py-10 text-center text-slate-400 dark:border-slate-800 dark:text-slate-500">
              {search ? "Tidak ada data BAA yang cocok dengan pencarian" : "Belum ada data BAA"}
            </div>
          ) : (
            paginated.map((item) => (
              <div
                key={item.id_baa}
                className="space-y-2 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                onDoubleClick={() => router.push(`/workspace?view=baa&id_baa=${item.id_baa}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <BaaImageDialog fotoUrl={item.foto_instalasi} kodeBaa={item.kode_baa} />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.fab?.nama_pelanggan ?? "-"}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.kode_baa}</p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <BaaActionMenu
                      item={item}
                      onEdit={setEditItem}
                      onDelete={setDeleteItem}
                      triggerClassName="h-8 w-8 p-0"
                      currentUser={currentUser}
                    />
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300">{formatTanggal(item.tanggal_instalasi)}</p>

                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500">Teknisi:</span>
                    <span className="ml-1 text-slate-700 dark:text-slate-300">{item.users?.nama ?? "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500">OLT:</span>
                    <span className="ml-1 text-slate-700 dark:text-slate-300">{item.olt?.nama_olt ?? "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500">ODP:</span>
                    <span className="ml-1 text-slate-700 dark:text-slate-300">{item.odp?.nama_odp ?? "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500">ONT:</span>
                    <span className="ml-1 text-slate-700 dark:text-slate-300">{item.ont?.serial_number ?? "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500">Material:</span>
                    <span className="ml-1 text-slate-700 dark:text-slate-300">{item.baadetail?.length ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500">Status:</span>
                    <span className="ml-1 font-semibold text-green-600 dark:text-green-400">
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>
                </div>

                {item.catatan && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Catatan: {item.catatan}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
        )}

        <BaaPagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
      </div>

      {editItem && (
        <BaaDialog
          mode="edit"
          baa={editItem}
          fabOptions={fabOptions}
          teknisiOptions={teknisiOptions}
          oltOptions={oltOptions}
          odpOptions={odpOptions}
          ontOptions={ontOptions}
          materialOptions={materialOptions}
          currentUser={currentUser}
          open={!!editItem}
          onOpenChange={(isOpen) => !isOpen && setEditItem(null)}
        />
      )}

      {deleteItem && (
        <BaaDeleteDialog
          id={deleteItem.id_baa}
          kodeBaa={deleteItem.kode_baa}
          open={!!deleteItem}
          onOpenChange={(isOpen) => !isOpen && setDeleteItem(null)}
        />
      )}

      {/* Bulk Delete Dialog */}
      {bulkDeleteOpen && bulkDeleteIds.length > 0 && (
        <BaaDeleteDialog
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
};