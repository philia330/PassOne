"use client";

import { useMemo, useState } from "react";
import { Search, Inbox, Layers, AlertTriangle } from "lucide-react";
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
import { MaterialDialog } from "@/app/masterdata/material/components/MaterialDialog";
import { MaterialDeleteDialog } from "@/app/masterdata/material/components/MaterialDeleteDialog";
import type { MaterialData } from "@/types/material";

interface MaterialTableProps {
  data: MaterialData[];
}

const PAGE_SIZE = 5;

export const MaterialTable = ({ data }: MaterialTableProps) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return data.filter(
      (item) =>
        item.nama_material.toLowerCase().includes(query) ||
        item.kode_material.toLowerCase().includes(query)
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
      {/* Search bar + Total Material */}
      <Card className="flex-row rounded-3xl shadow-xl border bg-white p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            type="text"
            placeholder="Cari kode / nama material..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="rounded-2xl h-12 pl-11 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400"
          />
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 px-4 py-2.5 text-white shadow-md shadow-purple-200 flex-shrink-0">
          <Layers size={18} className="text-white/90" />
          <div className="leading-tight">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
              Total Material
            </p>
            <p className="text-lg font-extrabold">{data.length}</p>
          </div>
        </div>
      </Card>

      {/* DESKTOP: Table */}
      <div className="hidden md:block">
        <Card className="rounded-3xl shadow-xl border bg-white overflow-hidden hover:shadow-2xl transition-all">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">No</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kode</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Material</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Stok</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Satuan</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Harga</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Kondisi</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Keterangan</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16 text-slate-400">
                      <Inbox className="mx-auto mb-3" size={40} />
                      <p className="font-semibold text-slate-700">Belum ada data material</p>
                      <p className="text-sm">
                        {search
                          ? "Tidak ada material yang cocok dengan pencarian."
                          : "Silakan tambahkan material baru terlebih dahulu."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((item, index) => {
                    const menipis = item.stok < item.minimal_stok;
                    return (
                      <TableRow key={item.id_material} className="hover:bg-purple-50/40 transition-colors">
                        <TableCell className="text-center text-slate-400 font-medium">
                          {(page - 1) * PAGE_SIZE + index + 1}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-mono rounded-lg border-purple-200 bg-purple-50 text-purple-700 font-semibold"
                          >
                            {item.kode_material}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">{item.nama_material}</TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              menipis ? "text-red-600" : "text-slate-900"
                            }`}
                          >
                            {menipis && <AlertTriangle size={13} />}
                            {item.stok}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600 font-medium">{item.satuan}</TableCell>
                        <TableCell className="font-bold text-slate-900 whitespace-nowrap">
                          Rp {item.harga.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              item.kondisi === "BAIK"
                                ? "bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-100"
                                : "bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-100"
                            }
                          >
                            {item.kondisi === "BAIK" ? "Baik" : "Rusak"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm max-w-[180px]">
                          <span className="block truncate" title={item.keterangan ?? undefined}>
                            {item.keterangan || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <MaterialDialog mode="edit" material={item} />
                            <MaterialDeleteDialog id={item.id_material} namaMaterial={item.nama_material} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* MOBILE: Card list */}
      <div className="space-y-3 md:hidden">
        {paginated.length === 0 ? (
          <Card className="rounded-3xl shadow-xl border bg-white p-12 text-center text-slate-400">
            <Inbox className="mx-auto mb-3" size={40} />
            <p className="font-semibold text-slate-700">Belum ada data material</p>
            <p className="text-sm">
              {search
                ? "Tidak ada material yang cocok dengan pencarian."
                : "Silakan tambahkan material baru terlebih dahulu."}
            </p>
          </Card>
        ) : (
          paginated.map((item, index) => {
            const menipis = item.stok < item.minimal_stok;
            return (
              <Card
                key={item.id_material}
                className="rounded-3xl shadow-xl border bg-white p-4 hover:shadow-2xl transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className="font-mono rounded-lg border-purple-200 bg-purple-50 text-purple-700 font-semibold text-xs"
                      >
                        {item.kode_material}
                      </Badge>
                      <Badge
                        className={
                          item.kondisi === "BAIK"
                            ? "bg-green-100 text-green-700 rounded-lg font-semibold text-xs hover:bg-green-100"
                            : "bg-red-100 text-red-700 rounded-lg font-semibold text-xs hover:bg-red-100"
                        }
                      >
                        {item.kondisi === "BAIK" ? "Baik" : "Rusak"}
                      </Badge>
                    </div>

                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {item.nama_material}
                    </p>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2 text-xs">
                      <div>
                        <span className="text-slate-400">Stok:</span>
                        <span className={`ml-1 font-bold ${menipis ? "text-red-600" : "text-slate-700"}`}>
                          {menipis && <AlertTriangle size={11} className="inline mr-0.5" />}
                          {item.stok} {item.satuan}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Harga:</span>
                        <span className="ml-1 font-bold text-slate-700">
                          Rp {item.harga.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    {item.keterangan && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {item.keterangan}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <MaterialDialog mode="edit" material={item} />
                    <MaterialDeleteDialog id={item.id_material} namaMaterial={item.nama_material} />
                  </div>
                </div>
              </Card>
            );
          })
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