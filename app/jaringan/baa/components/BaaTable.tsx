"use client";

import { useMemo, useState } from "react";
import { Search, Inbox, Boxes, ClipboardList, MoreVertical, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { BaaDialog } from "@/app/jaringan/baa/components/BaaDialog";
import { BaaDeleteDialog } from "@/app/jaringan/baa/components/BaaDeleteDialog";
import { BaaImageDialog } from "@/app/jaringan/baa/components/BaaImageDialog";
import { InfoTooltip } from "@/app/jaringan/baa/components/InfoTooltip";
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
  search?: string;
}

const PAGE_SIZE = 5;

const STATUS_STYLE: Record<StatusBaa, string> = {
  SELESAI: "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-500/20 dark:text-green-400",
};

const STATUS_LABEL: Record<StatusBaa, string> = {
  SELESAI: "Selesai",
};

function formatTanggal(date: Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
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
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), triggerClassName)}
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
            href={`/jaringan/baadetail/${item.id_baa}`}
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
            className="rounded-xl gap-3 px-2.5 py-2 cursor-pointer focus:bg-amber-50 dark:focus:bg-amber-500/10"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/20">
              <Pencil className="h-4 w-4 text-amber-600 dark:text-amber-400" />
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
  search: externalSearch,
}: BaaTableProps) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  const [editItem, setEditItem] = useState<BaaData | null>(null);
  const [deleteItem, setDeleteItem] = useState<BaaData | null>(null);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const result = a.kode_baa.localeCompare(b.kode_baa, undefined, { numeric: true });
      return sortOrder === "asc" ? result : -result;
    });
  }, [data, sortOrder]);

  const filtered = useMemo(() => {
    return sortedData.filter(
      (item) =>
        item.kode_baa.toLowerCase().includes(search.toLowerCase()) ||
        (item.fab?.nama_pelanggan ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }, [sortedData, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Search bar + sort (mobile) + tombol tambah */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <Input
            type="text"
            placeholder="Cari kode BAA / nama pelanggan..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-11 rounded-2xl border-slate-200 pl-9 pr-4 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tombol sort -- cuma tampil di mobile, karena desktop sudah bisa klik header */}
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
          {currentUser.role === "ADMIN" && <BaaExportButton />}
        </div>
      </div>

      {/* DESKTOP: Table */}
      <div className="hidden md:block">
        <Card className="rounded-3xl shadow-xl border bg-white overflow-hidden hover:shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/50">
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
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
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Foto</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Tanggal Instalasi</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">FAB / Pelanggan</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      Teknisi
                      <InfoTooltip text="Hanya menampilkan penanggung jawab utama. Cek daftar lengkap & kelola lewat menu Aksi → Kelola Teknisi." />
                    </span>
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">OLT</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">ODP</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">ONT</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Port OLT</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Port ODP</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">RX Power</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">TX Power</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Speed ↓</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Speed ↑</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Ping</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Catatan</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      Material
                      <InfoTooltip text="Hanya menampilkan jumlah item. Cek rincian lengkap lewat menu Aksi → Detail & Material." />
                    </span>
                  </TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Status</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[100px] dark:text-slate-400">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={19} className="text-center py-16 text-slate-400 dark:text-slate-500">
                      <Inbox className="mx-auto mb-3" size={40} />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Belum ada data BAA</p>
                      <p className="text-sm">
                        {search ? "Tidak ada data yang cocok dengan pencarian." : "Silakan tambahkan data BAA baru terlebih dahulu."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((item) => (
                    <TableRow key={item.id_baa} className="hover:bg-purple-50/40 transition-colors dark:hover:bg-purple-500/10">
                      <TableCell>
                        <Badge variant="outline" className="font-mono rounded-lg border-purple-200 bg-purple-50 text-purple-700 font-semibold dark:border-purple-800 dark:bg-purple-500/10 dark:text-purple-400">
                          {item.kode_baa}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        <BaaImageDialog fotoUrl={item.foto_instalasi} kodeBaa={item.kode_baa} />
                      </TableCell>

                      <TableCell className="text-slate-600 whitespace-nowrap dark:text-slate-400">{formatTanggal(item.tanggal_instalasi)}</TableCell>
                      <TableCell className="font-semibold text-slate-900 whitespace-nowrap dark:text-slate-100">{item.fab?.nama_pelanggan ?? "—"}</TableCell>
                      <TableCell className="text-slate-600 whitespace-nowrap dark:text-slate-400">{item.users?.nama ?? "—"}</TableCell>
                      <TableCell className="text-slate-600 whitespace-nowrap dark:text-slate-400">{item.olt?.nama_olt ?? "—"}</TableCell>
                      <TableCell className="text-slate-600 whitespace-nowrap dark:text-slate-400">{item.odp?.nama_odp ?? "—"}</TableCell>
                      <TableCell className="text-slate-600 whitespace-nowrap font-mono text-xs dark:text-slate-400">{item.ont?.serial_number ?? "—"}</TableCell>
                      <TableCell className="text-center text-slate-600 dark:text-slate-400">{item.port_olt ?? "—"}</TableCell>
                      <TableCell className="text-center text-slate-600 dark:text-slate-400">{item.port_odp ?? "—"}</TableCell>
                      <TableCell className="text-center text-slate-600 whitespace-nowrap dark:text-slate-400">{item.rx_power_dbm !== null ? `${item.rx_power_dbm} dBm` : "—"}</TableCell>
                      <TableCell className="text-center text-slate-600 whitespace-nowrap dark:text-slate-400">{item.tx_power_dbm !== null ? `${item.tx_power_dbm} dBm` : "—"}</TableCell>
                      <TableCell className="text-slate-600 whitespace-nowrap dark:text-slate-400">{item.speed_download ?? "—"}</TableCell>
                      <TableCell className="text-slate-600 whitespace-nowrap dark:text-slate-400">{item.speed_upload ?? "—"}</TableCell>
                      <TableCell className="text-center text-slate-600 whitespace-nowrap dark:text-slate-400">{item.ping_ms !== null ? `${item.ping_ms} ms` : "—"}</TableCell>
                      <TableCell className="text-slate-500 text-sm max-w-[180px] dark:text-slate-400">
                        <span className="block truncate" title={item.catatan ?? undefined}>{item.catatan || "—"}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="rounded-lg border-slate-200 bg-slate-50 text-slate-600 font-semibold gap-1 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Boxes size={11} />
                          {item.baadetail?.length ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`rounded-lg font-semibold ${STATUS_STYLE[item.status]}`}>{STATUS_LABEL[item.status]}</Badge>
                      </TableCell>

                      <TableCell className="text-center">
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
        </Card>
      </div>

      {/* MOBILE */}
      <div className="space-y-3 md:hidden">
        {paginated.length === 0 ? (
          <Card className="rounded-3xl shadow-xl border bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
            <Inbox className="mx-auto mb-3" size={40} />
            <p className="font-semibold text-slate-700 dark:text-slate-300">Belum ada data BAA</p>
            <p className="text-sm">{search ? "Tidak ada data yang cocok dengan pencarian." : "Silakan tambahkan data BAA baru terlebih dahulu."}</p>
          </Card>
        ) : (
          paginated.map((item) => (
            <Card key={item.id_baa} className="rounded-3xl shadow-xl border bg-white p-4 hover:shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <BaaImageDialog fotoUrl={item.foto_instalasi} kodeBaa={item.kode_baa} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="outline" className="font-mono rounded-lg border-purple-200 bg-purple-50 text-purple-700 font-semibold text-xs dark:border-purple-800 dark:bg-purple-500/10 dark:text-purple-400">{item.kode_baa}</Badge>
                      <Badge className={`rounded-lg font-semibold text-xs ${STATUS_STYLE[item.status]}`}>{STATUS_LABEL[item.status]}</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900 text-sm truncate dark:text-slate-100">{item.fab?.nama_pelanggan ?? "—"}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatTanggal(item.tanggal_instalasi)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2 text-xs">
                      <div><span className="text-slate-400 dark:text-slate-500">Teknisi:</span><span className="ml-1 text-slate-700 dark:text-slate-300">{item.users?.nama ?? "—"}</span></div>
                      <div><span className="text-slate-400 dark:text-slate-500">OLT:</span><span className="ml-1 text-slate-700 dark:text-slate-300">{item.olt?.nama_olt ?? "—"}</span></div>
                      <div><span className="text-slate-400 dark:text-slate-500">ODP:</span><span className="ml-1 text-slate-700 dark:text-slate-300">{item.odp?.nama_odp ?? "—"}</span></div>
                      <div><span className="text-slate-400 dark:text-slate-500">ONT:</span><span className="ml-1 text-slate-700 font-mono dark:text-slate-300">{item.ont?.serial_number ?? "—"}</span></div>
                      <div><span className="text-slate-400 dark:text-slate-500">Material:</span><span className="ml-1 text-slate-700 font-semibold dark:text-slate-300">{item.baadetail?.length ?? 0}</span></div>
                    </div>
                  </div>
                </div>
                {/* Action button - rata tengah */}
                <div className="flex flex-col gap-1.5 flex-shrink-0 items-center justify-start pt-1">
                  <BaaActionMenu
                    item={item}
                    onEdit={setEditItem}
                    onDelete={setDeleteItem}
                    triggerClassName="h-8 w-8 p-0"
                    currentUser={currentUser}
                  />
                </div>
              </div>
              {item.catatan && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 truncate dark:text-slate-400"><span className="text-slate-400 dark:text-slate-500">Catatan:</span> {item.catatan}</p>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Pagination -- disamakan dengan FabPagination (info total data + gradient active page) */}
      <BaaPagination
        page={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

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
    </div>
  );
};