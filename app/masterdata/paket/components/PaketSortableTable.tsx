"use client";

import { useState, useMemo } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaketDialog } from "./PaketDialog";
import { PaketDeleteDialog } from "./PaketDeleteDialog";
import { PaketSearch } from "./PaketSearch";
import { PaketPagination } from "./PaketPagination";

type Paket = {
  id_paket: number;
  kode_paket: string;
  nama_paket: string;
  kecepatan: string;
  harga: number;
  keterangan: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const PAGE_SIZE = 10;

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export function PaketSortableTable({
  initialData,
  kodeOtomatis,
  defaultValue,
}: {
  initialData: Paket[];
  kodeOtomatis: string;
  defaultValue: string;
}) {
  const [search, setSearch] = useState(defaultValue);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return initialData.filter(
      (item) =>
        item.kode_paket.toLowerCase().includes(query) ||
        item.nama_paket.toLowerCase().includes(query) ||
        item.kecepatan.toLowerCase().includes(query)
    );
  }, [initialData, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const result = a.kode_paket.localeCompare(b.kode_paket, undefined, { numeric: true });
      return sortOrder === "asc" ? result : -result;
    });
  }, [filtered, sortOrder]);

  const totalPagesCalc = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card className="rounded-3xl border shadow-xl transition-all hover:shadow-2xl dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PaketSearch defaultValue={search} />
          <PaketDialog mode="create" kodeOtomatis={kodeOtomatis} />
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto rounded-2xl border dark:border-slate-800 md:block">
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
                <TableHead className="dark:text-slate-300">Nama Paket</TableHead>
                <TableHead className="dark:text-slate-300">Kecepatan</TableHead>
                <TableHead className="dark:text-slate-300">Harga</TableHead>
                <TableHead className="dark:text-slate-300">Keterangan</TableHead>
                <TableHead className="text-center dark:text-slate-300">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {search ? "Tidak ada data paket yang cocok" : "Belum ada data paket"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((item) => (
                  <TableRow key={item.id_paket} className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                    <TableCell className="font-medium dark:text-slate-200">{item.kode_paket}</TableCell>
                    <TableCell className="dark:text-slate-300">{item.nama_paket}</TableCell>
                    <TableCell className="dark:text-slate-300">{item.kecepatan}</TableCell>
                    <TableCell className="font-semibold dark:text-slate-200">{formatRupiah(item.harga)}</TableCell>
                    <TableCell className="max-w-[220px] truncate text-slate-500 dark:text-slate-400">{item.keterangan || "-"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <PaketDialog mode="edit" paket={item} />
                        <PaketDeleteDialog id={item.id_paket} namaPaket={item.nama_paket} />
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
          {paginated.map((item) => (
            <div key={item.id_paket} className="space-y-2 rounded-2xl border p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold dark:text-slate-100">{item.nama_paket}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.kode_paket}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <PaketDialog mode="edit" paket={item} />
                  <PaketDeleteDialog id={item.id_paket} namaPaket={item.nama_paket} />
                </div>
              </div>
              <p className="text-sm dark:text-slate-300">Kecepatan: {item.kecepatan}</p>
              <p className="text-sm font-semibold dark:text-slate-300">{formatRupiah(item.harga)}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <PaketPagination page={page} totalPages={totalPagesCalc} />
        </div>
      </CardContent>
    </Card>
  );
}
