"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Inbox,
  MapPin,
  Phone,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ImageIcon,
  Edit2,
  Trash2,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FabDialog } from "@/app/jaringan/fab/components/FabDialog";
import { FabDeleteDialog } from "@/app/jaringan/fab/components/FabDeleteDialog";
import { FabViewDialog } from "@/app/jaringan/fab/components/FabViewDialog";
import { FabPagination } from "@/app/jaringan/fab/components/FabPagination";
import type {
  FabData,
  AreaOption,
  PaketOption,
  UserOption,
  StatusFab,
  CurrentUser,
} from "@/types/fab";

interface FabTableProps {
  data: FabData[];
  areaOptions: AreaOption[];
  paketOptions: PaketOption[];
  salesOptions: UserOption[];
  currentUser: CurrentUser;
  kodeOtomatis: string;
}

const PAGE_SIZE = 5;

const STATUS_STYLE: Record<StatusFab, string> = {
  OPEN: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  AKTIF: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
};

const STATUS_LABEL: Record<StatusFab, string> = {
  OPEN: "Open",
  AKTIF: "Aktif",
};

const formatTanggal = (date: Date) =>
  new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

type SortOrder = "asc" | "desc";

function FabFotoButton({ foto, namaPelanggan }: { foto?: string | null; namaPelanggan: string }) {
  if (!foto) return <span className="text-slate-400 text-xs">—</span>;

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
      <span className="text-slate-700 dark:text-slate-200">{item.penginput?.nama ?? "—"}</span>
      {item.penginput && item.penginput.id_user !== item.id_user && (
        <Badge className="text-[10px] px-1.5 py-0 rounded-md bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
          Teknisi
        </Badge>
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
  kodeOtomatis, // <-- BARU
}: FabTableProps) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // "desc" = kode terbesar/terbaru duluan, "asc" = kode terkecil/terlama duluan
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  // Sort data by kode_fab sesuai sortOrder yang dipilih user
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const numA = parseInt(a.kode_fab.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.kode_fab.replace(/\D/g, "")) || 0;
      return sortOrder === "asc" ? numA - numB : numB - numA;
    });
  }, [data, sortOrder]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return sortedData.filter(
      (item) =>
        item.kode_fab.toLowerCase().includes(query) ||
        item.nama_pelanggan.toLowerCase().includes(query) ||
        item.nik.includes(search)
    );
  }, [sortedData, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

const canEdit = (item: FabData) => {
  if (currentUser.role !== "SALES" && currentUser.role !== "TEKNISI") return true;
  return item.penginput?.id_user === currentUser.id_user;
};

const canDelete = () => {
  return currentUser.role !== "SALES" && currentUser.role !== "TEKNISI";
};

  const SortIcon = sortOrder === "asc" ? ArrowUp : ArrowDown;

  return (
    <div className="space-y-6">
      {/* Search bar + Total FAB */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <Input
            type="text"
            placeholder="Cari kode FAB / nama pelanggan / NIK..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-11 rounded-2xl border-slate-200 pl-9 pr-4 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <FabDialog
          mode="create"
          kodeOtomatis={kodeOtomatis}
          areaOptions={areaOptions}
          paketOptions={paketOptions}
          salesOptions={salesOptions}
          currentUser={currentUser}
        />
      </div>

      {/* DESKTOP: Table */}
      <div className="hidden md:block">
        <Card className="rounded-3xl shadow-xl border bg-white overflow-hidden hover:shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/50">
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider p-0 dark:text-slate-400">
                    <button
                      type="button"
                      onClick={toggleSort}
                      className="flex w-full items-center gap-1.5 px-4 py-3.5 text-left hover:text-purple-600 transition-colors cursor-pointer"
                      title={sortOrder === "asc" ? "Urutan: terlama dulu" : "Urutan: terbaru dulu"}
                    >
                      Kode
                      <SortIcon size={20} className="text-purple-500" />
                    </button>
                  </TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Foto
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Nama Pelanggan</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">NIK</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">No. HP</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Alamat</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Area</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Paket</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Sales</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Diinput Oleh</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Status</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Dibuat</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-16 text-slate-400">
                      <Inbox className="mx-auto mb-3" size={40} />
                      <p className="font-semibold text-slate-700">Belum ada data FAB</p>
                      <p className="text-sm">
                        {search
                          ? "Tidak ada data yang cocok dengan pencarian."
                          : "Silakan tambahkan pengajuan FAB baru terlebih dahulu."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((item) => (
                    <TableRow key={item.id_fab} className="hover:bg-purple-50/40 transition-colors dark:hover:bg-purple-500/10">
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-mono rounded-lg border-purple-200 bg-purple-50 text-purple-700 font-semibold dark:border-purple-800 dark:bg-purple-500/10 dark:text-purple-400"
                        >
                          {item.kode_fab}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <FabFotoButton foto={item.foto} namaPelanggan={item.nama_pelanggan} />
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{item.nama_pelanggan}</TableCell>
                      <TableCell className="text-slate-600 font-mono text-sm dark:text-slate-400">{item.nik}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{item.no_hp}</TableCell>
                      <TableCell className="text-slate-500 text-sm max-w-[180px] dark:text-slate-400">
                        <span className="block truncate" title={item.alamat}>
                          {item.alamat}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{item.area?.nama_area ?? "—"}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{item.paket?.nama_paket ?? "—"}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{item.users?.nama ?? "—"}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        <DiinputOlehCell item={item} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`rounded-lg font-semibold ${STATUS_STYLE[item.status]}`}>
                          {STATUS_LABEL[item.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm whitespace-nowrap dark:text-slate-400">
                        {formatTanggal(item.createdAt)}
                      </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <FabViewDialog fab={item} />
                              {canEdit(item) && (
                                <FabDialog
                                  mode="edit"
                                  fab={item}
                                  areaOptions={areaOptions}
                                  paketOptions={paketOptions}
                                  salesOptions={salesOptions}
                                  currentUser={currentUser}
                                />
                              )}
                              {canDelete() && (
                                <FabDeleteDialog id={item.id_fab} namaPelanggan={item.nama_pelanggan} />
                              )}
                            </div>
                          </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* MOBILE: toggle sort juga, taruh di atas list card */}
      <div className="md:hidden flex justify-end">
        <button
          type="button"
          onClick={toggleSort}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:text-purple-600 hover:border-purple-200 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <ArrowUpDown size={20} />
          {sortOrder === "asc" ? "Terlama dulu" : "Terbaru dulu"}
        </button>
      </div>

      {/* MOBILE: Card list */}
      <div className="space-y-3 md:hidden">
        {paginated.length === 0 ? (
          <Card className="rounded-3xl shadow-xl border bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
            <Inbox className="mx-auto mb-3" size={40} />
            <p className="font-semibold text-slate-700 dark:text-slate-300">Belum ada data FAB</p>
            <p className="text-sm">
              {search
                ? "Tidak ada data yang cocok dengan pencarian."
                : "Silakan tambahkan pengajuan FAB baru terlebih dahulu."}
            </p>
          </Card>
        ) : (
          paginated.map((item) => (
            <Card
              key={item.id_fab}
              className="rounded-3xl shadow-xl border bg-white p-4 hover:shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="font-mono rounded-lg border-purple-200 bg-purple-50 text-purple-700 font-semibold text-xs dark:border-purple-800 dark:bg-purple-500/10 dark:text-purple-400"
                    >
                      {item.kode_fab}
                    </Badge>
                    <Badge className={`rounded-lg font-semibold text-xs ${STATUS_STYLE[item.status]}`}>
                      {STATUS_LABEL[item.status]}
                    </Badge>
                  </div>

                  <p className="font-semibold text-slate-900 text-sm truncate dark:text-slate-100">
                    {item.nama_pelanggan}
                  </p>
                  <p className="text-xs text-slate-500 font-mono dark:text-slate-400">{item.nik}</p>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Phone size={11} className="text-purple-500 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">{item.no_hp}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500">Area:</span>
                      <span className="ml-1 text-slate-700 dark:text-slate-300">{item.area?.nama_area ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500">Paket:</span>
                      <span className="ml-1 text-slate-700 dark:text-slate-300">{item.paket?.nama_paket ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500">Sales:</span>
                      <span className="ml-1 text-slate-700 dark:text-slate-300">{item.users?.nama ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500">Diinput:</span>
                      <span className="ml-1 text-slate-700 dark:text-slate-300">{item.penginput?.nama ?? "—"}</span>
                      {item.penginput && item.penginput.id_user !== item.id_user && (
                        <Badge className="ml-1 text-[10px] px-1.5 py-0 rounded-md bg-sky-100 text-sky-700 hover:bg-sky-100">
                          Teknisi
                        </Badge>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500">Dibuat:</span>
                      <span className="ml-1 text-slate-700 dark:text-slate-300">{formatTanggal(item.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-1 mt-1 text-xs">
                    <MapPin size={11} className="text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-500 line-clamp-2 dark:text-slate-400">{item.alamat}</span>
                  </div>
                </div>

                {/* Action buttons - rata tengah dan ukuran konsisten */}
                <div className="flex flex-col gap-1.5 flex-shrink-0 items-center">
                  <FabFotoButton foto={item.foto} namaPelanggan={item.nama_pelanggan} />
                  <FabViewDialog fab={item} />
                  {canEdit(item) && (
                    <FabDialog
                      mode="edit"
                      fab={item}
                      areaOptions={areaOptions}
                      paketOptions={paketOptions}
                      salesOptions={salesOptions}
                      currentUser={currentUser}
                    />
                  )}
                  {canDelete() && (
                    <FabDeleteDialog id={item.id_fab} namaPelanggan={item.nama_pelanggan} />
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* ✅ Menggunakan FabPagination yang baru */}
      <FabPagination
        page={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
};