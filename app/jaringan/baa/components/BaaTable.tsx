"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, ClipboardList, MoreVertical, Pencil, Trash2, ArrowUp, ArrowDown, Filter, X, Loader2 } from "lucide-react";
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
import { BaaDialog } from "@/app/jaringan/baa/components/BaaDialog";
import { BaaDeleteDialog } from "@/app/jaringan/baa/components/BaaDeleteDialog";
import { BaaImageDialog } from "@/app/jaringan/baa/components/BaaImageDialog";
import { BaaPagination } from "@/app/jaringan/baa/components/BaaPagination";
import { BaaExportButton } from "@/app/jaringan/baa/components/BaaExportButton";
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

function SkeletonCard({ key }: { key: number }) {
  return (
    <div
      key={key}
      className="space-y-2 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-800/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
        <div className="h-8 w-8 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <div className="h-3 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

function formatTanggal(date: Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
  const isAdminOrLeader = currentUser.role === "ADMIN" || currentUser.role === "LEADER";
  const isOwner = currentUser.id_user === item.id_user;

  const canDelete = isAdminOrLeader;
  const canEdit = isAdminOrLeader || isOwner;

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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(false);

  // Detect when navigation happens (e.g., after router.refresh())
  useEffect(() => {
    setIsLoading(true);
    // Small delay to prevent flicker for fast operations
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [searchParams.toString(), pathname]);

  // Untuk TEKNISI, default filter ke diri sendiri
  const isTeknisi = currentUser.role === "TEKNISI";

  // Lazy initialization untuk filter - hitung nilai default sekali saat mount
  const [filterTeknisi, setFilterTeknisi] = useState<string>(() => {
    return isTeknisi ? String(currentUser.id_user) : "all";
  });

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

      return matchesSearch && matchesTeknisi;
    });
  }, [sortedData, search, filterTeknisi]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  const showFilterDropdown = isTeknisi || allTeknisiOptions.length > 0;

  return (
    <Card className="rounded-3xl border shadow-xl transition-all hover:shadow-2xl dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
      <div className="space-y-6 p-4 sm:p-6">
        {/* Search bar + Filter + Sort (mobile) + Tombol tambah */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
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

            {/* Filter Dropdown Teknisi - hanya tampil jika ada opsi atau role teknisi */}
            {showFilterDropdown && (
              <div className="flex items-center gap-2">
                <Select value={filterTeknisi} onValueChange={handleFilterChange}>
                  <SelectTrigger className="h-11 w-[180px] rounded-2xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                    <Filter className="h-4 w-4 mr-2 text-slate-400" />
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
                  <SelectContent>
                    {isTeknisi && (
                      <SelectItem value={String(currentUser.id_user)}>
                        Saya ({currentUser.nama})
                      </SelectItem>
                    )}
                    <SelectItem value="all">Semua</SelectItem>
                    {allTeknisiOptions.map((opt) => (
                      <SelectItem key={opt.id_user} value={String(opt.id_user)}>
                        {opt.nama}
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
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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

        {/* ====================================================== */}
        {/* Versi Tabel - hanya muncul di layar medium ke atas (md:) */}
        {/* ====================================================== */}
        <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
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
                  Material
                </TableHead>
                <TableHead className="text-center dark:text-slate-300">Status</TableHead>
                <TableHead className="text-right dark:text-slate-300">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton loading rows
                <>
                  <SkeletonRow colCount={18} />
                  <SkeletonRow colCount={18} />
                  <SkeletonRow colCount={18} />
                  <SkeletonRow colCount={18} />
                  <SkeletonRow colCount={18} />
                </>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={18} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {search ? "Tidak ada data BAA yang cocok dengan pencarian" : "Belum ada data BAA"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((item) => (
                  <TableRow
                    key={item.id_baa}
                    className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="font-medium dark:text-slate-200">{item.kode_baa}</TableCell>

                    <TableCell className="text-center">
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
                    <TableCell className="text-center dark:text-slate-300">{item.baadetail?.length ?? 0}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {STATUS_LABEL[item.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
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
                className="space-y-2 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-800/40"
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
                  <BaaActionMenu
                    item={item}
                    onEdit={setEditItem}
                    onDelete={setDeleteItem}
                    triggerClassName="h-8 w-8 p-0"
                    currentUser={currentUser}
                  />
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

        <div className="flex justify-end">
          <BaaPagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
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
    </Card>
  );
};