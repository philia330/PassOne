"use client";

import { useMemo, useState } from "react";
import { Search, Inbox, Layers, Boxes, ImageOff, ChevronRight } from "lucide-react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { BaaDialog } from "@/app/jaringan/baa/components/BaaDialog";
import { BaaDeleteDialog } from "@/app/jaringan/baa/components/BaaDeleteDialog";
import { BaaViewDialog } from "@/app/jaringan/baa/components/BaaViewDialog";
import type {
  BaaData,
  StatusBaa,
  FabOption,
  TeknisiOption,
  OltOption,
  OdpOption,
  OntOption,
  MaterialOption,
} from "@/types/baa";

interface BaaTableProps {
  data: BaaData[];
  fabOptions: FabOption[];
  teknisiOptions: TeknisiOption[];
  oltOptions: OltOption[];
  odpOptions: OdpOption[];
  ontOptions: OntOption[];
  materialOptions: MaterialOption[];
}

const PAGE_SIZE = 5;

const STATUS_STYLE: Record<StatusBaa, string> = {
  PENDING: "bg-slate-100 text-slate-600 hover:bg-slate-100",
  PROSES: "bg-sky-100 text-sky-700 hover:bg-sky-100",
  SELESAI: "bg-green-100 text-green-700 hover:bg-green-100",
};

const STATUS_LABEL: Record<StatusBaa, string> = {
  PENDING: "Pending",
  PROSES: "Proses",
  SELESAI: "Selesai",
};

function formatTanggal(date: Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const BaaTable = ({
  data,
  fabOptions,
  teknisiOptions,
  oltOptions,
  odpOptions,
  ontOptions,
  materialOptions,
}: BaaTableProps) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return data.filter(
      (item) =>
        item.kode_baa.toLowerCase().includes(search.toLowerCase()) ||
        (item.fab?.nama_pelanggan ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Search bar + Total BAA */}
      <Card className="flex-row rounded-3xl shadow-xl border bg-white p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            type="text"
            placeholder="Cari kode BAA / nama pelanggan..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="rounded-2xl h-12 pl-11 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
          />
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 px-4 py-2.5 text-white shadow-md shadow-purple-200 flex-shrink-0">
          <Layers size={18} className="text-white/90" />
          <div className="leading-tight">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
              Total BAA
            </p>
            <p className="text-lg font-extrabold">{data.length}</p>
          </div>
        </div>
      </Card>

      {/* DESKTOP: Table - hidden on mobile */}
      <div className="hidden md:block">
        <Card className="rounded-3xl shadow-xl border bg-white overflow-hidden hover:shadow-2xl transition-all">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">No</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kode</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Foto</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal Instalasi</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">FAB / Pelanggan</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teknisi</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">OLT</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">ODP</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">ONT</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Port OLT</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Port ODP</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">RX Power</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">TX Power</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Speed ↓</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Speed ↑</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Ping</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catatan</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Material</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={20} className="text-center py-16 text-slate-400">
                      <Inbox className="mx-auto mb-3" size={40} />
                      <p className="font-semibold text-slate-700">Belum ada data BAA</p>
                      <p className="text-sm">
                        {search
                          ? "Tidak ada data yang cocok dengan pencarian."
                          : "Silakan tambahkan data BAA baru terlebih dahulu."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((item, index) => (
                    <TableRow key={item.id_baa} className="hover:bg-purple-50/40 transition-colors">
                      <TableCell className="text-center text-slate-400 font-medium">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-mono rounded-lg border-purple-200 bg-purple-50 text-purple-700 font-semibold"
                        >
                          {item.kode_baa}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.foto_instalasi ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.foto_instalasi}
                            alt={`Foto instalasi ${item.kode_baa}`}
                            className="h-10 w-10 rounded-lg object-cover border border-slate-200 mx-auto"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto">
                            <ImageOff size={14} className="text-slate-300" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600 whitespace-nowrap">
                        {formatTanggal(item.tanggal_instalasi)}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900 whitespace-nowrap">
                        {item.fab?.nama_pelanggan ?? "—"}
                      </TableCell>
                      <TableCell className="text-slate-600 whitespace-nowrap">
                        {item.user?.nama ?? "—"}
                      </TableCell>
                      <TableCell className="text-slate-600 whitespace-nowrap">
                        {item.olt?.nama_olt ?? "—"}
                      </TableCell>
                      <TableCell className="text-slate-600 whitespace-nowrap">
                        {item.odp?.nama_odp ?? "—"}
                      </TableCell>
                      <TableCell className="text-slate-600 whitespace-nowrap font-mono text-xs">
                        {item.ont?.serial_number ?? "—"}
                      </TableCell>
                      <TableCell className="text-center text-slate-600">{item.port_olt ?? "—"}</TableCell>
                      <TableCell className="text-center text-slate-600">{item.port_odp ?? "—"}</TableCell>
                      <TableCell className="text-center text-slate-600 whitespace-nowrap">
                        {item.rx_power_dbm !== null ? `${item.rx_power_dbm} dBm` : "—"}
                      </TableCell>
                      <TableCell className="text-center text-slate-600 whitespace-nowrap">
                        {item.tx_power_dbm !== null ? `${item.tx_power_dbm} dBm` : "—"}
                      </TableCell>
                      <TableCell className="text-slate-600 whitespace-nowrap">
                        {item.speed_download ?? "—"}
                      </TableCell>
                      <TableCell className="text-slate-600 whitespace-nowrap">
                        {item.speed_upload ?? "—"}
                      </TableCell>
                      <TableCell className="text-center text-slate-600 whitespace-nowrap">
                        {item.ping_ms !== null ? `${item.ping_ms} ms` : "—"}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm max-w-[180px]">
                        <span className="block truncate" title={item.catatan ?? undefined}>
                          {item.catatan || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="rounded-lg border-slate-200 bg-slate-50 text-slate-600 font-semibold gap-1"
                        >
                          <Boxes size={11} />
                          {item.baaDetails?.length ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`rounded-lg font-semibold ${STATUS_STYLE[item.status]}`}>
                          {STATUS_LABEL[item.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <BaaViewDialog baa={item} />
                          <BaaDialog
                            mode="edit"
                            baa={item}
                            fabOptions={fabOptions}
                            teknisiOptions={teknisiOptions}
                            oltOptions={oltOptions}
                            odpOptions={odpOptions}
                            ontOptions={ontOptions}
                            materialOptions={materialOptions}
                          />
                          <BaaDeleteDialog id={item.id_baa} kodeBaa={item.kode_baa} />
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

      {/* MOBILE: Card list - visible below md */}
      <div className="space-y-3 md:hidden">
        {paginated.length === 0 ? (
          <Card className="rounded-3xl shadow-xl border bg-white p-12 text-center text-slate-400">
            <Inbox className="mx-auto mb-3" size={40} />
            <p className="font-semibold text-slate-700">Belum ada data BAA</p>
            <p className="text-sm">
              {search
                ? "Tidak ada data yang cocok dengan pencarian."
                : "Silakan tambahkan data BAA baru terlebih dahulu."}
            </p>
          </Card>
        ) : (
          paginated.map((item, index) => (
            <Card key={item.id_baa} className="rounded-3xl shadow-xl border bg-white p-4 hover:shadow-2xl transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header: Kode BAA + Status */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="font-mono rounded-lg border-purple-200 bg-purple-50 text-purple-700 font-semibold text-xs"
                    >
                      {item.kode_baa}
                    </Badge>
                    <Badge className={`rounded-lg font-semibold text-xs ${STATUS_STYLE[item.status]}`}>
                      {STATUS_LABEL[item.status]}
                    </Badge>
                  </div>

                  {/* Main info */}
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {item.fab?.nama_pelanggan ?? "—"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatTanggal(item.tanggal_instalasi)}
                    </p>
                  </div>

                  {/* Detail grid */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2 text-xs">
                    <div>
                      <span className="text-slate-400">Teknisi:</span>
                      <span className="ml-1 text-slate-700">{item.user?.nama ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">OLT:</span>
                      <span className="ml-1 text-slate-700">{item.olt?.nama_olt ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">ODP:</span>
                      <span className="ml-1 text-slate-700">{item.odp?.nama_odp ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">ONT:</span>
                      <span className="ml-1 text-slate-700 font-mono">{item.ont?.serial_number ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Material:</span>
                      <span className="ml-1 text-slate-700 font-semibold">{item.baaDetails?.length ?? 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Foto:</span>
                      <span className="ml-1 text-slate-700">
                        {item.foto_instalasi ? (
                          <span className="text-purple-600">✓ Ada</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <BaaViewDialog baa={item} />
                  <BaaDialog
                    mode="edit"
                    baa={item}
                    fabOptions={fabOptions}
                    teknisiOptions={teknisiOptions}
                    oltOptions={oltOptions}
                    odpOptions={odpOptions}
                    ontOptions={ontOptions}
                    materialOptions={materialOptions}
                  />
                  <BaaDeleteDialog id={item.id_baa} kodeBaa={item.kode_baa} />
                </div>
              </div>

              {/* Catatan - if exists */}
              {item.catatan && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500 truncate">
                    <span className="text-slate-400">Catatan:</span> {item.catatan}
                  </p>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={p === page}
                  onClick={() => setPage(p)}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};