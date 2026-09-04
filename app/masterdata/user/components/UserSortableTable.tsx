"use client";

import { useState, useMemo, useEffect, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Check,
  Trash2,
  Download,
  X,
  Loader2,
  Filter,
  ShieldCheck,
  Users,
  BriefcaseBusiness,
  Wrench,
  Truck,
  Venus,
  Mars,
  CheckCircle2,
  XCircle,
  Users2,
  ToggleLeft,
  VenusAndMars,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { UserFormDialog } from "./UserFormDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { UserSearch } from "./UserSearch";
import { UserPagination } from "./UserPagination";
import ImagePreview from "@/components/shared/image-preview";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CurrentUser = {
  id_user: number;
  nama: string;
  role: string;
};

const ROLE_BADGE_STYLES: Record<string, string> = {
  ADMIN: "bg-pink-100 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400",
  LEADER: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  SALES: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  TEKNISI: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  LOGISTIK: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
};

const DEFAULT_ROLE_STYLE = "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300";

const JKL_BADGE_STYLES: Record<"LAKI_LAKI" | "PEREMPUAN", string> = {
  LAKI_LAKI: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  PEREMPUAN: "bg-pink-100 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400",
};

const JKL_LABEL: Record<"LAKI_LAKI" | "PEREMPUAN", string> = {
  LAKI_LAKI: "Laki-laki",
  PEREMPUAN: "Perempuan",
};

type User = {
  id_user: number;
  kode_user: string;
  nama: string;
  username: string;
  email: string | null;
  foto: string | null;
  jkl: "LAKI_LAKI" | "PEREMPUAN";
  role: "ADMIN" | "LEADER" | "SALES" | "TEKNISI" | "LOGISTIK";
  no_hp: string | null;
  status: boolean;
};

const PAGE_SIZE = 10;

export function UserSortableTable({
  initialData,
  defaultValue,
  currentUser,
  total,
  page: initialPage,
  actions,
}: {
  initialData: User[];
  defaultValue: string;
  currentUser?: CurrentUser;
  total: number;
  page: number;
  actions?: ReactNode;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(defaultValue);
  const [page, setPage] = useState(initialPage);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeRoleFilter, setActiveRoleFilter] = useState<"ALL" | User["role"]>("ALL");
  const [activeStatusFilter, setActiveStatusFilter] = useState<"ALL" | "true" | "false">("ALL");
  const [activeJklFilter, setActiveJklFilter] = useState<"ALL" | "LAKI_LAKI" | "PEREMPUAN">("ALL");

  // BUG FIX: useState(initialPage) cuma dibaca sekali waktu mount pertama.
  // Sinkronkan ulang setiap kali prop `initialPage` berubah.
  useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);

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
  const roleFilterOptions = currentUser?.role === "LEADER"
    ? (["ALL", "SALES", "TEKNISI"] as const)
    : (["ALL", "ADMIN", "LEADER", "SALES", "TEKNISI", "LOGISTIK"] as const);

  const roleFilterMeta: Record<"ALL" | User["role"], { icon: typeof Filter; color: string; label: string }> = {
    ALL: { icon: Users2, color: "text-slate-500 dark:text-slate-400", label: "Semua Role" },
    ADMIN: { icon: ShieldCheck, color: "text-pink-600 dark:text-pink-400", label: "ADMIN" },
    LEADER: { icon: Users, color: "text-purple-600 dark:text-purple-400", label: "LEADER" },
    SALES: { icon: BriefcaseBusiness, color: "text-blue-600 dark:text-blue-400", label: "SALES" },
    TEKNISI: { icon: Wrench, color: "text-orange-600 dark:text-orange-400", label: "TEKNISI" },
    LOGISTIK: { icon: Truck, color: "text-emerald-600 dark:text-emerald-400", label: "LOGISTIK" },
  };

  const statusFilterMeta: Record<"ALL" | "true" | "false", { icon: typeof Filter; color: string; label: string }> = {
    ALL: { icon: ToggleLeft, color: "text-purple-500", label: "Semua Status" },
    true: { icon: CheckCircle2, color: "text-green-600 dark:text-green-400", label: "Aktif" },
    false: { icon: XCircle, color: "text-red-600 dark:text-red-400", label: "Nonaktif" },
  };

  const jklFilterMeta: Record<"ALL" | "LAKI_LAKI" | "PEREMPUAN", { icon: typeof Filter; color: string; label: string }> = {
    ALL: { icon: VenusAndMars, color: "text-purple-500", label: "Semua Gender" },
    LAKI_LAKI: { icon: Mars, color: "text-blue-600 dark:text-blue-400", label: "Laki-laki" },
    PEREMPUAN: { icon: Venus, color: "text-pink-600 dark:text-pink-400", label: "Perempuan" },
  };

  const selectedRoleFilter = roleFilterMeta[activeRoleFilter];
  const selectedStatusFilter = statusFilterMeta[activeStatusFilter];
  const selectedJklFilter = jklFilterMeta[activeJklFilter];

  // Clear selection when filters/search change
  useEffect(() => {
    setSelectedIds(new Set());
    setSelectAllPage(false);
  }, [search, activeRoleFilter, activeStatusFilter, activeJklFilter]);

  // Handle highlight dari Command Palette (query param: highlight=<id_user>)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const highlightId = params.get("highlight");

    if (highlightId !== lastHighlightId.current) {
      highlightHandled.current = false;
      lastHighlightId.current = highlightId;
    }

    if (!highlightId || highlightHandled.current) return;
    highlightHandled.current = true;

    const targetId = Number(highlightId);
    if (isNaN(targetId)) return;

    const item = initialData.find((u) => u.id_user === targetId);
    if (!item) return;

    setSearch(item.nama);
    setPage(1);

    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("search", item.nama);
      url.searchParams.delete("highlight");
      url.searchParams.set("page", "1");
      window.history.replaceState({}, "", url.toString());
    }, 100);

    setTimeout(() => {
      setHighlightedId(targetId);

      setTimeout(() => {
        const row = rowRefs.current.get(targetId);
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
        }
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
    return initialData.filter((user) => {
      const matchesRole = activeRoleFilter === "ALL" || user.role === activeRoleFilter;
      const matchesStatus =
        activeStatusFilter === "ALL" || String(user.status) === activeStatusFilter;
      const matchesJkl = activeJklFilter === "ALL" || user.jkl === activeJklFilter;
      const matchesSearch =
        user.kode_user.toLowerCase().includes(query) ||
        user.nama.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        (user.email?.toLowerCase().includes(query) ?? false);

      return matchesRole && matchesStatus && matchesJkl && matchesSearch;
    });
  }, [activeRoleFilter, activeStatusFilter, activeJklFilter, initialData, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const result = a.kode_user.localeCompare(b.kode_user, undefined, { numeric: true });
      return sortOrder === "asc" ? result : -result;
    });
  }, [filtered, sortOrder]);

  const totalPagesCalc = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Data sudah dipaginasi di server; di sini cuma difilter/sort untuk
  // feedback instan, tanpa slice ulang berdasarkan `page`.
  const paginated = sorted;

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
    const allSelected = paginated.every((item) => selectedIds.has(item.id_user));
    if (selectAllPage && allSelected) {
      setSelectAllPage(false);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((item) => next.delete(item.id_user));
        return next;
      });
    } else {
      setSelectAllPage(true);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((item) => next.add(item.id_user));
        return next;
      });
    }
  };

  const handleBulkExport = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.error("Pilih item yang ingin diekspor");
      return;
    }

    setIsExporting(true);
    try {
      const url = ids.length === sorted.length
        ? `/api/user/export`
        : `/api/user/export?ids=${ids.join(",")}`;

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
        : `Export_User_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlBlob;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);

      toast.success(`Berhasil mengekspor ${ids.length} data User`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Terjadi kesalahan saat mengekspor data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.error("Pilih item yang ingin dihapus");
      return;
    }
    setBulkDeleteIds(ids);
    setBulkDeleteOpen(true);
  };

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

        {/* ====================================================== */}
        {/* NAVIGASI - diselaraskan dengan gaya FabTable            */}
        {/* Baris 1: Search (kiri) + Aksi & Tambah (kanan)           */}
        {/* ====================================================== */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full max-w-xs">
            <UserSearch value={search} onChange={setSearch} />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {actions}
            <div className="add-button">
              <UserFormDialog mode="create" currentUserRole={currentUser?.role} />
            </div>
          </div>
        </div>

        {/* Baris 2: Filter Role + Filter Status + Filter Jenis Kelamin */}
        <div className="flex flex-wrap items-center gap-2 overflow-visible">
          {/* Filter Role */}
          <div className="flex items-center gap-2">
            <Select value={activeRoleFilter} onValueChange={(value) => setActiveRoleFilter(value as typeof activeRoleFilter)}>
              <SelectTrigger className="h-11 w-[250px] shrink-0 gap-2 rounded-2xl border-slate-200 bg-white pr-8 shadow-sm transition-colors hover:border-purple-300 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700">
                <selectedRoleFilter.icon className={`h-4 w-4 ${selectedRoleFilter.color} shrink-0`} />
                <SelectValue placeholder="Semua Role" className="min-w-0 flex-1 truncate text-left">
                  {(value: string) => (
                    <span className="block truncate">
                      {roleFilterMeta[value as typeof activeRoleFilter]?.label ?? "Semua Role"}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                side="bottom"
                alignItemWithTrigger={false}
                className="z-[100] max-h-64 w-[250px] overflow-y-auto rounded-2xl border border-slate-200 p-1.5 shadow-lg dark:border-slate-700"
              >
                {roleFilterOptions.map((role) => {
                  const meta = roleFilterMeta[role];
                  const Icon = meta.icon;

                  return (
                    <SelectItem key={role} value={role} className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10">
                      <span className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${meta.color} shrink-0`} />
                        <span>{meta.label}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {activeRoleFilter !== "ALL" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveRoleFilter("ALL")}
                className="h-11 w-11 p-0 rounded-2xl border border-slate-200 dark:border-slate-700"
              >
                <X className="h-4 w-4 text-slate-500" />
              </Button>
            )}
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2">
            <Select value={activeStatusFilter} onValueChange={(value) => setActiveStatusFilter(value as typeof activeStatusFilter)}>
              <SelectTrigger className="h-11 w-[230px] shrink-0 gap-2 rounded-2xl border-slate-200 bg-white pr-8 shadow-sm transition-colors hover:border-purple-300 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700">
                <selectedStatusFilter.icon className={`h-4 w-4 ${selectedStatusFilter.color} shrink-0`} />
                <SelectValue placeholder="Semua Status" className="min-w-0 flex-1 truncate text-left">
                  {(value: string) => (
                    <span className="block truncate">
                      {statusFilterMeta[value as typeof activeStatusFilter]?.label ?? "Semua Status"}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                side="bottom"
                alignItemWithTrigger={false}
                className="z-[100] w-[230px] rounded-2xl border border-slate-200 p-1.5 shadow-lg dark:border-slate-700"
              >
                {(["ALL", "true", "false"] as const).map((val) => {
                  const meta = statusFilterMeta[val];
                  const Icon = meta.icon;

                  return (
                    <SelectItem key={val} value={val} className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10">
                      <span className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${meta.color} shrink-0`} />
                        <span>{meta.label}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {activeStatusFilter !== "ALL" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveStatusFilter("ALL")}
                className="h-11 w-11 p-0 rounded-2xl border border-slate-200 dark:border-slate-700"
              >
                <X className="h-4 w-4 text-slate-500" />
              </Button>
            )}
          </div>

          {/* Filter Jenis Kelamin */}
          <div className="flex items-center gap-2">
            <Select value={activeJklFilter} onValueChange={(value) => setActiveJklFilter(value as typeof activeJklFilter)}>
              <SelectTrigger className="h-11 w-[240px] shrink-0 gap-2 rounded-2xl border-slate-200 bg-white pr-8 shadow-sm transition-colors hover:border-purple-300 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-700">
                <selectedJklFilter.icon className={`h-4 w-4 ${selectedJklFilter.color} shrink-0`} />
                <SelectValue placeholder="Semua Gender" className="min-w-0 flex-1 truncate text-left">
                  {(value: string) => (
                    <span className="block truncate">
                      {jklFilterMeta[value as typeof activeJklFilter]?.label ?? "Semua Gender"}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                side="bottom"
                alignItemWithTrigger={false}
                className="z-[100] w-[240px] rounded-2xl border border-slate-200 p-1.5 shadow-lg dark:border-slate-700"
              >
                {(["ALL", "LAKI_LAKI", "PEREMPUAN"] as const).map((val) => {
                  const meta = jklFilterMeta[val];
                  const Icon = meta.icon;

                  return (
                    <SelectItem key={val} value={val} className="rounded-xl gap-2 py-2.5 cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-500/10">
                      <span className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${meta.color} shrink-0`} />
                        <span>{meta.label}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {activeJklFilter !== "ALL" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveJklFilter("ALL")}
                className="h-11 w-11 p-0 rounded-2xl border border-slate-200 dark:border-slate-700"
              >
                <X className="h-4 w-4 text-slate-500" />
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto rounded-2xl border dark:border-slate-800 md:block table-container">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50">
                <TableHead className="w-12 text-center dark:text-slate-300">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="inline-flex items-center justify-center"
                    title={selectAllPage ? "Batalkan pilih semua halaman ini" : "Pilih semua halaman ini"}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                        paginated.length > 0 && paginated.every((item) => selectedIds.has(item.id_user))
                          ? "border-purple-500 bg-purple-500"
                          : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                      }`}
                    >
                      {paginated.length > 0 && paginated.every((item) => selectedIds.has(item.id_user)) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </button>
                </TableHead>
                <TableHead className="dark:text-slate-400">
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
                <TableHead className="dark:text-slate-400">Foto</TableHead>
                <TableHead className="dark:text-slate-400">Nama</TableHead>
                <TableHead className="dark:text-slate-400">Username</TableHead>
                <TableHead className="dark:text-slate-400">Email</TableHead>
                <TableHead className="dark:text-slate-400">No. HP</TableHead>
                <TableHead className="dark:text-slate-400">Jenis Kelamin</TableHead>
                <TableHead className="dark:text-slate-400">Role</TableHead>
                <TableHead className="dark:text-slate-400">Status</TableHead>
                <TableHead className="text-center dark:text-slate-400">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {search ? "Tidak ada user yang cocok" : "Belum ada user"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((user) => (
                  <TableRow
                    key={user.id_user}
                    ref={(el) => { if (el) rowRefs.current.set(user.id_user, el); else rowRefs.current.delete(user.id_user); }}
                    className={cn(
                      "hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 transition-colors",
                      selectedIds.has(user.id_user)
                        ? "bg-purple-50 dark:bg-purple-500/10"
                        : "",
                      highlightedId === user.id_user && "bg-yellow-100 dark:bg-yellow-500/20 ring-2 ring-yellow-400 dark:ring-yellow-500"
                    )}
                  >
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(user.id_user);
                        }}
                        className="inline-flex items-center justify-center"
                      >
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                            selectedIds.has(user.id_user)
                              ? "border-purple-500 bg-purple-500"
                              : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                          }`}
                        >
                          {selectedIds.has(user.id_user) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="font-medium dark:text-slate-200" onClick={(e) => e.stopPropagation()}>{user.kode_user}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="h-10 w-10 overflow-hidden rounded-full border bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                        {user.foto ? (
                          <ImagePreview src={user.foto} alt={user.nama} width={40} height={40} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400 dark:text-slate-500">
                            {user.nama.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="dark:text-slate-300" onClick={(e) => e.stopPropagation()}>{user.nama}</TableCell>
                    <TableCell className="dark:text-slate-300" onClick={(e) => e.stopPropagation()}>{user.username}</TableCell>
                    <TableCell className="dark:text-slate-300" onClick={(e) => e.stopPropagation()}>{user.email ?? "-"}</TableCell>
                    <TableCell className="dark:text-slate-300" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {user.no_hp ?? "-"}
                        {user.no_hp && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 rounded-lg cursor-pointer hover:bg-green-50 dark:hover:bg-green-500/20"
                            onClick={() => {
                              let cleanNumber = user.no_hp!.replace(/\D/g, "");
                              if (cleanNumber.startsWith("0")) {
                                cleanNumber = "62" + cleanNumber.substring(1);
                              }
                              window.open(`https://wa.me/${cleanNumber}`, "_blank", "noopener,noreferrer");
                            }}
                            title={`Hubungi ${user.nama} via WhatsApp`}
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${JKL_BADGE_STYLES[user.jkl]}`}>
                        {user.jkl === "LAKI_LAKI" ? <Mars className="h-3 w-3" /> : <Venus className="h-3 w-3" />}
                        {JKL_LABEL[user.jkl]}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ROLE_BADGE_STYLES[user.role] ?? DEFAULT_ROLE_STYLE}`}>{user.role}</span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.status ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"}`}>
                        {user.status ? "Aktif" : "Nonaktif"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-2">
                        <UserFormDialog mode="edit" data={user} currentUserRole={currentUser?.role} />
                        <DeleteUserDialog id={user.id_user} name={user.nama ?? ""} />
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
          {paginated.map((user) => (
            <div
              key={user.id_user}
              className={`rounded-2xl border border-slate-200 p-4 dark:border-slate-800 ${
                selectedIds.has(user.id_user) ? "border-purple-300 bg-purple-50 dark:bg-purple-500/10" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleSelect(user.id_user)}
                  className="mt-2 shrink-0"
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                      selectedIds.has(user.id_user)
                        ? "border-purple-500 bg-purple-500"
                        : "border-slate-300 dark:border-slate-600 hover:border-purple-400"
                    }`}
                  >
                    {selectedIds.has(user.id_user) && (
                      <Check className="h-3.5 w-3.5 text-white" />
                    )}
                  </div>
                </button>
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                  {user.foto ? (
                    <img src={user.foto} alt={user.nama} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-base font-semibold text-slate-400 dark:text-slate-500">
                      {user.nama.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold dark:text-slate-100">{user.nama}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{user.kode_user}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <UserFormDialog mode="edit" data={user} currentUserRole={currentUser?.role} />
                      <DeleteUserDialog id={user.id_user} name={user.nama ?? ""} />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {user.no_hp && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 rounded-lg cursor-pointer hover:bg-green-50 dark:hover:bg-green-500/20"
                        onClick={() => {
                          let cleanNumber = user.no_hp!.replace(/\D/g, "");
                          if (cleanNumber.startsWith("0")) {
                            cleanNumber = "62" + cleanNumber.substring(1);
                          }
                          window.open(`https://wa.me/${cleanNumber}`, "_blank", "noopener,noreferrer");
                        }}
                        title={`Hubungi ${user.nama} via WhatsApp`}
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </Button>
                    )}
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${JKL_BADGE_STYLES[user.jkl]}`}>
                      {user.jkl === "LAKI_LAKI" ? <Mars className="h-3 w-3" /> : <Venus className="h-3 w-3" />}
                      {JKL_LABEL[user.jkl]}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE_STYLES[user.role] ?? DEFAULT_ROLE_STYLE}`}>{user.role}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.status ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"}`}>
                      {user.status ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <UserPagination page={page} totalPages={totalPagesCalc} />
        </div>
      </CardContent>

      {/* Bulk Delete Dialog */}
      {bulkDeleteOpen && bulkDeleteIds.length > 0 && (
        <DeleteUserDialog
          id={bulkDeleteIds[0]}
          name={`${bulkDeleteIds.length} User`}
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