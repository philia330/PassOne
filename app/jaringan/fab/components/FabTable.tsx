"use client";

import { useMemo, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Phone,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  Loader2,
  IdCard,
  Router,
  Package,
  UserRound,
  Calendar,
  Trash2,
  Download,
  Check,
  UserCog,
} from "lucide-react";
import { FabActionsDropdown } from "./FabActionsDropdown";
import { FabViewDialog } from "./FabViewDialog";
import { FabDeleteDialog } from "./FabDeleteDialog";
import { FabAssignDialog } from "./FabAssignDialog";
import { FabImageDialog } from "./FabImageDialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { FabPagination } from "@/app/jaringan/fab/components/FabPagination";
import { FabDialog } from "./FabDialog";
import { PageSizeSelector } from "@/components/ui/page-size-selector";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  FabData,
  AreaOption,
  PaketOption,
  UserOption,
  StatusFab,
  CurrentUser,
} from "@/types/fab";

interface PenginputOption {
  id_user: number;
  nama: string;
}

interface TeknisiOption {
  id_user: number;
  nama: string;
  username: string;
  foto: string | null;
}

// ================== SKELETON ROW COMPONENTS ==================

function SkeletonRow({ colCount = 13 }: { colCount?: number }) {
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

interface FabTableProps {
  data: FabData[];
  areaOptions: AreaOption[];
  paketOptions: PaketOption[];
  salesOptions: UserOption[];
  currentUser: CurrentUser;
  kodeOtomatis: string;
  penginputOptions?: PenginputOption[];
  teknisiOptions?: TeknisiOption[];
  actions?: ReactNode;
}

const PAGE_SIZE = 5;

const STATUS_TEXT_STYLE: Record<StatusFab, string> = {
  OPEN: "text-sky-600 dark:text-sky-400",
  AKTIF: "text-green-600 dark:text-green-400",
};

const STATUS_BADGE_STYLE: Record<StatusFab, string> = {
  OPEN: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  AKTIF: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
};

const STATUS_LABEL: Record<StatusFab, string> = {
  OPEN: "Open",
  AKTIF: "Aktif",
};

const formatTanggal = (date: Date) =>
  new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

type SortOrder = "asc" | "desc";

function DiinputOlehCell({ item }: { item: FabData }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-slate-700 dark:text-slate-300">{item.penginput?.nama ?? "-"}</span>
      {item.penginput && item.penginput.id_user !== item.id_user && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
          Teknisi
        </span>
      )}
    </div>
  );
}

export const FabTable = ({
  data,
  areaOptions,
  paketOptions,
  salesOptions,
  currentUser,
  kodeOtomatis,
  penginputOptions = [],
  teknisiOptions = [],
  actions,
}: FabTableProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [isLoading, setIsLoading] = useState(false);

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteItem, setDeleteItem] = useState<FabData | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectAllPage, setSelectAllPage] = useState(false);
  const [viewItem, setViewItem] = useState<FabData | null>(null);

  // Bulk assign state
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);

  // Highlight state untuk Command Palette
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const highlightHandled = useRef(false);
  const lastHighlightId = useRef<string | null>(null);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

  // Handle highlight dari Command Palette / notifikasi (query param: highlight=<id_fab>)
  // PERBAIKAN BUG HIGHLIGHT: `data` yang diterima di sini SEKARANG SELALU
  // berisi semua FAB (lihat perbaikan di actions.ts getFabs) -- sebelumnya
  // server memfilter jadi cuma 1 baris kalau ada highlightId, makanya
  // menghapus teks pencarian di client percuma. Di effect ini sendiri tidak
  // ada yang perlu diubah soal itu, cukup cara menghapus query param `highlight`
  // dari URL yang diganti pakai router.replace() (bukan window.history
  // langsung) supaya searchParams dari useSearchParams() ikut konsisten.
  useEffect(() => {
    const highlightId = searchParams.get("highlight");

    // Reset highlightHandled jika nilai highlight berubah (navigasi baru)
    if (highlightId !== lastHighlightId.current) {
      highlightHandled.current = false;
      lastHighlightId.current = highlightId;
    }

    if (!highlightId || highlightHandled.current) return;
    highlightHandled.current = true;

    const targetId = Number(highlightId);
    if (isNaN(targetId)) return;

    // Cari item di data
    const item = data.find((f) => f.id_fab === targetId);
    if (!item) return;

    // Set search ke nama pelanggan dan reset filters
    setSearch(item.nama_pelanggan);
    setFilterPenginput("all");
    setFilterTahun("all");
    setFilterBulan("all");
    setPage(1);

    // Buka dialog detail setelah render
    setTimeout(() => {
      setViewItem(item);

      // Scroll ke baris setelah dialog terbuka
      setTimeout(() => {
        const row = rowRefs.current.get(targetId);
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        // Hapus highlight setelah 3 detik
        setTimeout(() => setHighlightedId(null), 3000);
      }, 100);
    }, 200);

    // Hapus highlight param dari URL -- pakai router.replace (bukan
    // window.history.replaceState langsung) supaya searchParams dari
    // useSearchParams() ikut ter-update konsisten di sisi Next.js, bukan
    // cuma tampilan address bar doang.
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("highlight");
      const queryString = url.searchParams.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
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

  // Untuk SALES dan TEKNISI, default filter ke diri sendiri
  const isSalesOrTeknisi = currentUser.role === "SALES" || currentUser.role === "TEKNISI";

  // Lazy initialization untuk filter - hitung nilai default sekali saat mount
  const [filterPenginput, setFilterPenginput] = useState<string>(() => {
    return isSalesOrTeknisi ? String(currentUser.id_user) : "all";
  });

  // Filter bulan - default ke bulan berjalan
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

  // Filter teknisi - untuk role TEKNISI, default ke FAB yang ditugaskan ke mereka
  const isTeknisi = currentUser.role === "TEKNISI";
  const [filterTeknisi, setFilterTeknisi] = useState<string>(() => {
    return isTeknisi ? String(currentUser.id_user) : "all";
  });

  // Clear selection when filters/search change
  useEffect(() => {
    setSelectedIds(new Set());
    setSelectAllPage(false);
  }, [search, filterPenginput, filterTahun, filterBulan, filterTeknisi]);

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

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const numA = parseInt(a.kode_fab.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.kode_fab.replace(/\D/g, "")) || 0;
      return sortOrder === "asc" ? numA - numB : numB - numA;
    });
  }, [data, sortOrder]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return sortedData.filter((item) => {
      // Filter search
      const matchesSearch =
        item.kode_fab.toLowerCase().includes(query) ||
        item.nama_pelanggan.toLowerCase().includes(query) ||
        item.nik.includes(search);

      // Filter berdasarkan penginput
      const penginputId = item.penginput?.id_user;
      const matchesPenginput = filterPenginput === "all" || penginputId === Number(filterPenginput);

      // Filter berdasarkan teknisi yang ditugaskan (khusus TEKNISI)
      const teknisiId = (item as any).teknisiDitugaskan?.id_user;
      const matchesTeknisi = filterTeknisi === "all" || teknisiId === Number(filterTeknisi);

      // Filter berdasarkan tahun dan bulan
      const itemDate = new Date(item.createdAt);
      const itemYear = String(itemDate.getFullYear());
      const itemMonth = String(itemDate.getMonth() + 1).padStart(2, "0");
      const matchesTahun = filterTahun === "all" || itemYear === filterTahun;
      const matchesBulan = filterBulan === "all" || itemMonth === filterBulan;

      return matchesSearch && matchesPenginput && matchesTahun && matchesBulan && matchesTeknisi;
    });
  }, [sortedData, search, filterPenginput, filterTahun, filterBulan, filterTeknisi]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Selection persists across pages but does NOT auto-select on page change

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (value: string | null) => {
    setFilterPenginput(value ?? "all");
    setPage(1);
  };

  const clearFilter = () => {
    setFilterPenginput("all");
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

  const canEdit = (item: FabData) => {
    if (currentUser.role !== "SALES" && currentUser.role !== "TEKNISI") return true;
    return item.penginput?.id_user === currentUser.id_user;
  };

  // Hanya Admin yang bisa hapus
  const canDelete = currentUser.role === "ADMIN";

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
    const allSelected = paginated.every((item) => selectedIds.has(item.id_fab));
    if (selectAllPage && allSelected) {
      // Uncheck all on current page only
      setSelectAllPage(false);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((item) => next.delete(item.id_fab));
        return next;
      });
    } else {
      // Select all on current page and enable auto-select mode
      setSelectAllPage(true);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((item) => next.add(item.id_fab));
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
      const response = await fetch(`/api/fab/export?ids=${ids.join(",")}`);

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Gagal mengekspor data");
        return;
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `Export_FAB_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlBlob;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);

      toast.success(`Berhasil mengekspor ${ids.length} data FAB`);
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
    setIsBulkDeleting(false);
    router.refresh();
  };

  const showFilterDropdown = isSalesOrTeknisi ? true : penginputOptions.length > 0;

  // Role yang boleh bulk assign
  const canBulkAssign =
    currentUser.role === "ADMIN" ||
    currentUser.role === "LEADER" ||
    currentUser.role === "SALES";

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
              {/* Bulk Assign ke Teknisi - hanya untuk ADMIN, LEADER, SALES */}
              {canBulkAssign && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setBulkAssignOpen(true)}
                  className="h-9 rounded-xl text-purple-600 hover:bg-purple-50 hover:text-purple-700 dark:text-purple-400 dark:hover:bg-purple-500/10"
                >
                  <UserCog className="mr-1.5 h-4 w-4" />
                  Tugaskan
                </Button>
              )}
              {canDelete && (
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

        {/* Baris 1: Search (kiri) + Sort mobile & Aksi & Tambah (kanan) */}
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div className="relative w-full max-w-xs">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
    <Input
      type="text"
      placeholder="Cari kode FAB / nama pelanggan / NIK..."
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

    {actions}
    <FabDialog
      mode="create"
      kodeOtomatis={kodeOtomatis}
      areaOptions={areaOptions}
      paketOptions={paketOptions}
      salesOptions={salesOptions}
      currentUser={currentUser}
    />
  </div>
</div>

        {/* Baris 2: Filter Penginput + Filter Bulan + Page Size Selector */}
        <div className="flex flex-wrap items-center gap-2 overflow-visible">
          {/* Filter Dropdown Penginput - hanya tampil jika ada opsi atau role yang sesuai */}
          {showFilterDropdown && (
            <div className="flex items-center gap-2">
              <Select value={filterPenginput} onValueChange={handleFilterChange}>
                <SelectTrigger className="h-11 w-[190px] rounded-2xl border-slate-200 bg-white shadow-sm transition-colors hover:border-purple-300 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700">
                  <Filter className="h-4 w-4 mr-2 text-purple-500 shrink-0" />
                  <SelectValue placeholder="Filter penginput">
                    {(value: string) => {
                      if (value === "all") return "Semua";
                      if (isSalesOrTeknisi && value === String(currentUser.id_user)) {
                        return `Saya (${currentUser.nama})`;
                      }
                      const opt = penginputOptions.find((o) => String(o.id_user) === value);
                      return opt?.nama ?? "Filter penginput";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto rounded-2xl border-slate-200 p-1.5 shadow-lg dark:border-slate-700 z-[100]">
                  {isSalesOrTeknisi && (
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
                  {penginputOptions.map((opt) => (
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
              {filterPenginput !== "all" && (
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

          {/* Filter Dropdown Teknisi - khusus untuk TEKNISI melihat FAB yang ditugaskan ke mereka */}
          {isTeknisi && (
            <div className="flex items-center gap-2">
              <Select value={filterTeknisi} onValueChange={(value) => { if (value) { setFilterTeknisi(value); setPage(1); } }}>
                <SelectTrigger className="h-11 w-[200px] rounded-2xl border-slate-200 bg-white shadow-sm transition-colors hover:border-purple-300 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700">
                  <UserCog className="h-4 w-4 mr-2 text-purple-500 shrink-0" />
                  <SelectValue>
                    {filterTeknisi === String(currentUser.id_user) ? "Ditugaskan ke Saya" : "Semua FAB"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto rounded-2xl border-slate-200 p-1.5 shadow-lg dark:border-slate-700 z-[100]">
                  <SelectItem
                    value="all"
                    className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10"
                  >
                    <span className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>Semua FAB</span>
                    </span>
                  </SelectItem>
                  <SelectItem
                    value={String(currentUser.id_user)}
                    className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10"
                  >
                    <span className="flex items-center gap-2">
                      <UserCog className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                      <span className="font-medium">Ditugaskan ke Saya</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Clear filter button */}
              {filterTeknisi !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFilterTeknisi("all"); setPage(1); }}
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
    className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 p-1.5 shadow-lg dark:border-slate-700 z-[100]"
  >
  {yearOptions.map((year) => (<SelectItem key={year} value={year} className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10"><span className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" /><span>{year === "all" ? "Semua" : year}</span></span></SelectItem>))}
</SelectContent>
          </Select>

          {/* Filter Dropdown Bulan */}
          <Select value={filterBulan} onValueChange={(value) => { if (value) { setFilterBulan(value); setPage(1); } }}>
            <SelectTrigger className="h-11 w-[110px] rounded-2xl border-slate-200 bg-white shadow-sm transition-colors hover:border-purple-300 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700">
              <Calendar className="h-4 w-4 mr-2 text-purple-500 shrink-0" />
              <SelectValue>
                {filterBulan === "all" ? (
                  <span>Semua</span>
                ) : (
                  <span>{getMonthName(filterBulan)}</span>
                )}
              </SelectValue>
            </SelectTrigger>
              <SelectContent
    side="bottom"
    alignItemWithTrigger={false}
    className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 p-1.5 shadow-lg dark:border-slate-700 z-[100]"
  >
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
                        paginated.length > 0 && paginated.every((item) => selectedIds.has(item.id_fab))
                          ? "border-purple-500 bg-purple-500"
                          : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                      }`}
                    >
                      {paginated.length > 0 && paginated.every((item) => selectedIds.has(item.id_fab)) && (
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
                    title={sortOrder === "asc" ? "Urutan: terlama dulu" : "Urutan: terbaru dulu"}
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
                <TableHead className="dark:text-slate-300">Nama Pelanggan</TableHead>
                <TableHead className="dark:text-slate-300">NIK</TableHead>
                <TableHead className="dark:text-slate-300">No. HP</TableHead>
                <TableHead className="dark:text-slate-300">Alamat</TableHead>
                <TableHead className="dark:text-slate-300">Area</TableHead>
                <TableHead className="dark:text-slate-300">Paket</TableHead>
                <TableHead className="dark:text-slate-300">Sales</TableHead>
                <TableHead className="dark:text-slate-300">Diinput Oleh</TableHead>
                <TableHead className="dark:text-slate-300">Status</TableHead>
                <TableHead className="dark:text-slate-300">Dibuat</TableHead>
                <TableHead className="text-center dark:text-slate-300">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <>
                  <SkeletonRow colCount={14} />
                  <SkeletonRow colCount={14} />
                  <SkeletonRow colCount={14} />
                  <SkeletonRow colCount={14} />
                  <SkeletonRow colCount={14} />
                </>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {search
                      ? "Tidak ada data FAB yang cocok dengan pencarian"
                      : "Belum ada data FAB"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((item) => (
                  <TableRow
                    key={item.id_fab}
                    ref={(el) => {
                      if (el) rowRefs.current.set(item.id_fab, el);
                      else rowRefs.current.delete(item.id_fab);
                    }}
                    className={cn(
                      "border-b border-slate-200 dark:border-slate-800 transition-colors cursor-pointer",
                      selectedIds.has(item.id_fab)
                        ? "bg-purple-50 dark:bg-purple-500/10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                      highlightedId === item.id_fab && "bg-yellow-100 dark:bg-yellow-500/20 ring-2 ring-yellow-400 dark:ring-yellow-500"
                    )}
                    onDoubleClick={() => setViewItem(item)}
                  >
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(item.id_fab);
                        }}
                        className="inline-flex items-center justify-center"
                      >
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                            selectedIds.has(item.id_fab)
                              ? "border-purple-500 bg-purple-500"
                              : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                          }`}
                        >
                          {selectedIds.has(item.id_fab) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="font-medium dark:text-slate-200">
                      {item.kode_fab}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
            <FabImageDialog fotoUrl={item.foto} namaPelanggan={item.nama_pelanggan} />
          </TableCell>
                    <TableCell className="dark:text-slate-300">
                      {item.nama_pelanggan}
                    </TableCell>
                    <TableCell className="dark:text-slate-300">{item.nik}</TableCell>
                    <TableCell className="dark:text-slate-300">{item.no_hp}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-slate-500 dark:text-slate-400">
                      {item.alamat}
                    </TableCell>
                    <TableCell className="dark:text-slate-300">{item.area?.nama_area ?? "-"}</TableCell>
                    <TableCell className="dark:text-slate-300">{item.paket?.nama_paket ?? "-"}</TableCell>
                    <TableCell className="dark:text-slate-300">{item.users?.nama ?? "-"}</TableCell>
                    <TableCell>
                      <DiinputOlehCell item={item} />
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-semibold ${STATUS_TEXT_STYLE[item.status]}`}>
                        {STATUS_LABEL[item.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">
                      {formatTanggal(item.createdAt)}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-1">
                        <FabActionsDropdown
                          fab={item}
                          areaOptions={areaOptions}
                          paketOptions={paketOptions}
                          salesOptions={salesOptions}
                          currentUser={currentUser}
                          canEdit={canEdit(item)}
                          canDelete={canDelete}
                          teknisiOptions={teknisiOptions}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* MOBILE: cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <div className="grid gap-3 md:hidden">
            {paginated.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 py-10 text-center text-slate-400 dark:border-slate-800 dark:text-slate-500">
                {search
                  ? "Tidak ada data FAB yang cocok dengan pencarian"
                  : "Belum ada data FAB"}
              </div>
            ) : (
              paginated.map((item) => (
                <div
                  key={item.id_fab}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  onDoubleClick={() => setViewItem(item)}
                >
                  {/* Header: kode + nama + status + aksi */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
                    <div className="flex items-start gap-3 min-w-0">
                <FabImageDialog fotoUrl={item.foto} namaPelanggan={item.nama_pelanggan} />
                <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                          {item.nama_pelanggan}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{item.kode_fab}</p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_BADGE_STYLE[item.status]}`}
                      >
                        {STATUS_LABEL[item.status]}
                      </span>
                      <FabActionsDropdown
                        fab={item}
                        areaOptions={areaOptions}
                        paketOptions={paketOptions}
                        salesOptions={salesOptions}
                        currentUser={currentUser}
                        canEdit={canEdit(item)}
                        canDelete={canDelete}
                      />
                    </div>
                  </div>

                  {/* Body: detail kontak & alamat */}
                  <div className="space-y-2 p-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <IdCard size={14} className="shrink-0 text-slate-400 dark:text-slate-500" />
                      <span className="font-mono text-xs">{item.nik}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Phone size={14} className="shrink-0 text-slate-400 dark:text-slate-500" />
                      {item.no_hp}
                    </div>

                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                      <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
                      <span className="line-clamp-2">{item.alamat}</span>
                    </div>
                  </div>

                  {/* Footer: area/paket/sales/diinput/tanggal */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 bg-slate-50/60 p-4 text-xs dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Router size={12} className="shrink-0" />
                      <span className="truncate">{item.area?.nama_area ?? "-"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Package size={12} className="shrink-0" />
                      <span className="truncate">{item.paket?.nama_paket ?? "-"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <UserRound size={12} className="shrink-0" />
                      <span className="truncate">Sales: {item.users?.nama ?? "-"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Calendar size={12} className="shrink-0" />
                      {formatTanggal(item.createdAt)}
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 pt-1 border-t border-slate-200/70 dark:border-slate-700/50">
                      <span className="text-slate-400 dark:text-slate-500">Diinput:</span>
                      <DiinputOlehCell item={item} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination -- didorong ke kanan */}
        <div className="flex justify-end">
          <FabPagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Bulk Delete Dialog */}
      {bulkDeleteOpen && bulkDeleteIds.length > 0 && (
        <FabDeleteDialog
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

      {/* View Detail Dialog - triggered by double-click */}
      {viewItem && (
        <FabViewDialog
          fab={viewItem}
          open={!!viewItem}
          onOpenChange={(isOpen) => {
            if (!isOpen) setViewItem(null);
          }}
        />
      )}

      {/* Bulk Assign Dialog */}
      {bulkAssignOpen && selectedIds.size > 0 && (
        <FabAssignDialog
          open={bulkAssignOpen}
          onOpenChange={(isOpen) => {
            setBulkAssignOpen(isOpen);
            if (!isOpen) {
              setSelectedIds(new Set());
              setSelectAllPage(false);
            }
          }}
          selectedIds={Array.from(selectedIds).filter((id) => {
            const fab = data.find((f) => f.id_fab === id);
            return fab?.status === "OPEN";
          })}
          teknisiOptions={teknisiOptions}
        />
      )}
    </Card>
  );
};