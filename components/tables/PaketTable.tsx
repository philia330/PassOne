"use client";

import { useMemo, useState } from "react";
import { Search, Inbox, Layers } from "lucide-react";
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
import { FabDialog } from "@/components/dialogs/FabDialog";
import { FabDeleteDialog } from "@/components/dialogs/FabDeleteDialog";
import type { FabData, AreaOption, PaketOption, UserOption, StatusFab } from "@/types/fab";

interface FabTableProps {
  data: FabData[];
  areaOptions: AreaOption[];
  paketOptions: PaketOption[];
  salesOptions: UserOption[];
}

const PAGE_SIZE = 5;

const STATUS_STYLE: Record<StatusFab, string> = {
  PENDING: "bg-slate-100 text-slate-600 hover:bg-slate-100",
  SURVEY: "bg-sky-100 text-sky-700 hover:bg-sky-100",
  INSTALASI: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  SELESAI: "bg-green-100 text-green-700 hover:bg-green-100",
};

const STATUS_LABEL: Record<StatusFab, string> = {
  PENDING: "Pending",
  SURVEY: "Survey",
  INSTALASI: "Instalasi",
  SELESAI: "Selesai",
};

export const FabTable = ({ data, areaOptions, paketOptions, salesOptions }: FabTableProps) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return data.filter(
      (item) =>
        item.nama_pelanggan.toLowerCase().includes(search.toLowerCase()) ||
        item.nik.includes(search)
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
      {/* Search bar + Total FAB */}
      <Card className="flex-row rounded-3xl shadow-xl border bg-white p-4 flex items-center justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            type="text"
            placeholder="Cari nama pelanggan / NIK..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="rounded-2xl h-12 pl-11 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
          />
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 px-4 py-2.5 text-white shadow-md shadow-purple-200 flex-shrink-0">
          <Layers size={18} className="text-white/90" />
          <div className="leading-tight">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
              Total FAB
            </p>
            <p className="text-lg font-extrabold">{data.length}</p>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="rounded-3xl shadow-xl border bg-white overflow-hidden hover:shadow-2xl transition-all">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">No</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kode</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Pelanggan</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">NIK</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">No. HP</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alamat</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Latitude</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Longitude</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Area</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paket</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sales</TableHead>
              <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</TableHead>
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
              paginated.map((item, index) => (
                <TableRow key={item.id_fab} className="hover:bg-purple-50/40 transition-colors">
                  <TableCell className="text-center text-slate-400 font-medium">
                    {(page - 1) * PAGE_SIZE + index + 1}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-mono rounded-lg border-purple-200 bg-purple-50 text-purple-700 font-semibold"
                    >
                      {item.kode_fab}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">{item.nama_pelanggan}</TableCell>
                  <TableCell className="text-slate-600 font-mono text-sm">{item.nik}</TableCell>
                  <TableCell className="text-slate-600">{item.no_hp}</TableCell>
                  <TableCell className="text-slate-500 text-sm max-w-[200px]">
                    <span className="block truncate" title={item.alamat}>
                      {item.alamat}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600 font-mono text-xs whitespace-nowrap">
                    {item.latitude}
                  </TableCell>
                  <TableCell className="text-slate-600 font-mono text-xs whitespace-nowrap">
                    {item.longitude}
                  </TableCell>
                  <TableCell className="text-slate-600">{item.area?.nama_area ?? "—"}</TableCell>
                  <TableCell className="text-slate-600">{item.paket?.nama_paket ?? "—"}</TableCell>
                  <TableCell className="text-slate-600">{item.user?.nama ?? "—"}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`rounded-lg font-semibold ${STATUS_STYLE[item.status]}`}>
                      {STATUS_LABEL[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <FabDialog
                        mode="edit"
                        fab={item}
                        areaOptions={areaOptions}
                        paketOptions={paketOptions}
                        salesOptions={salesOptions}
                      />
                      <FabDeleteDialog id={item.id_fab} namaPelanggan={item.nama_pelanggan} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </Card>

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