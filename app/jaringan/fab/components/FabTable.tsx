"use client";

import { useMemo, useState, useEffect, ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  Phone,
  ArrowUp,
  ArrowDown,
  ImageIcon,
  Filter,
  X,
  Loader2,
  IdCard,
  Router,
  Package,
  UserRound,
  Calendar,
} from "lucide-react";
import { FabActionsDropdown } from "./FabActionsDropdown";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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

function FabFotoButton({ foto, namaPelanggan }: { foto?: string | null; namaPelanggan: string }) {
  if (!foto) return <span className="text-slate-400 dark:text-slate-500 text-xs">-</span>;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-500 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-purple-600 dark:hover:bg-purple-500/20 dark:hover:text-purple-400"
        >
          <ImageIcon size={16} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl p-4">
        <img
          src={foto}
          alt={`Foto depan rumah ${namaPelanggan}`}
          className="w-full rounded-2xl object-cover"
        />
      </DialogContent>
    </Dialog>
  );
}

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
  actions,
}: FabTableProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [isLoading, setIsLoading] = useState(false);

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

      return matchesSearch && matchesPenginput;
    });
  }, [sortedData, search, filterPenginput]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  const canEdit = (item: FabData) => {
    if (currentUser.role !== "SALES" && currentUser.role !== "TEKNISI") return true;
    return item.penginput?.id_user === currentUser.id_user;
  };

  // Hanya Admin dan Leader yang bisa hapus
  const canDelete = currentUser.role === "ADMIN" || currentUser.role === "LEADER";

  const showFilterDropdown = isSalesOrTeknisi ? true : penginputOptions.length > 0;

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
                placeholder="Cari kode FAB / nama pelanggan / NIK..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-11 rounded-2xl border-slate-200 pl-11 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

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
                  <SelectContent className="rounded-2xl border-slate-200 p-1.5 shadow-lg dark:border-slate-700">
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
                  <SkeletonRow colCount={13} />
                  <SkeletonRow colCount={13} />
                  <SkeletonRow colCount={13} />
                  <SkeletonRow colCount={13} />
                  <SkeletonRow colCount={13} />
                </>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {search
                      ? "Tidak ada data FAB yang cocok dengan pencarian"
                      : "Belum ada data FAB"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((item) => (
                  <TableRow
                    key={item.id_fab}
                    className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="font-medium dark:text-slate-200">
                      {item.kode_fab}
                    </TableCell>
                    <TableCell>
                      <FabFotoButton foto={item.foto} namaPelanggan={item.nama_pelanggan} />
                    </TableCell>
                    <TableCell className="dark:text-slate-300">{item.nama_pelanggan}</TableCell>
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
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
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
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800/40"
                >
                  {/* Header: kode + nama + status + aksi */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
                    <div className="flex items-start gap-3 min-w-0">
                      <FabFotoButton foto={item.foto} namaPelanggan={item.nama_pelanggan} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                          {item.nama_pelanggan}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{item.kode_fab}</p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
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

        <div className="flex justify-end">
          <FabPagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>
    </Card>
  );
};