"use client";

import { useState, useMemo } from "react";
import { ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MaterialDialog } from "./MaterialDialog";
import { MaterialDeleteDialog } from "./MaterialDeleteDialog";
import { MaterialSearch } from "./MaterialSearch";
import { MaterialPagination } from "./MaterialPagination";

type Material = {
  id_material: number;
  kode_material: string;
  nama_material: string;
  stok: number;
  minimal_stok: number;
  satuan: string;
  harga: number;
  kondisi: "BAIK" | "RUSAK";
  keterangan: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const PAGE_SIZE = 10;

export function MaterialSortableTable({
  initialData,
  kodeOtomatis,
  defaultValue,
  canDelete = false,
}: {
  initialData: Material[];
  kodeOtomatis: string;
  defaultValue: string;
  canDelete?: boolean;
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
        item.kode_material.toLowerCase().includes(query) ||
        item.nama_material.toLowerCase().includes(query) ||
        item.satuan.toLowerCase().includes(query)
    );
  }, [initialData, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const result = a.kode_material.localeCompare(b.kode_material, undefined, { numeric: true });
      return sortOrder === "asc" ? result : -result;
    });
  }, [filtered, sortOrder]);

  const totalPagesCalc = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Card className="rounded-3xl border shadow-xl transition-all hover:shadow-2xl dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <MaterialSearch defaultValue={search} />
          <MaterialDialog mode="create" kodeOtomatis={kodeOtomatis} />
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
                <TableHead className="dark:text-slate-300">Nama Material</TableHead>
                <TableHead className="text-center dark:text-slate-300">Stok</TableHead>
                <TableHead className="dark:text-slate-300">Satuan</TableHead>
                <TableHead className="dark:text-slate-300">Harga</TableHead>
                <TableHead className="text-center dark:text-slate-300">Kondisi</TableHead>
                <TableHead className="dark:text-slate-300">Keterangan</TableHead>
                <TableHead className="text-center dark:text-slate-300">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {search ? "Tidak ada data material yang cocok" : "Belum ada data material"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((item) => {
                  const menipis = item.stok < item.minimal_stok;
                  return (
                    <TableRow key={item.id_material} className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                      <TableCell className="font-medium dark:text-slate-200">{item.kode_material}</TableCell>
                      <TableCell className="dark:text-slate-300">{item.nama_material}</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center gap-1 font-semibold ${menipis ? "text-red-600 dark:text-red-400" : "dark:text-slate-300"}`}>
                          {menipis && <AlertTriangle size={13} />}
                          {item.stok}
                        </span>
                      </TableCell>
                      <TableCell className="dark:text-slate-300">{item.satuan}</TableCell>
                      <TableCell className="font-semibold dark:text-slate-200">{formatRupiah(item.harga)}</TableCell>
                      <TableCell className="text-center">
                        <span className={`text-sm font-semibold ${item.kondisi === "BAIK" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {item.kondisi === "BAIK" ? "Baik" : "Rusak"}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-slate-500 dark:text-slate-400">{item.keterangan || "-"}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <MaterialDialog mode="edit" material={item} />
                          {canDelete && <MaterialDeleteDialog id={item.id_material} namaMaterial={item.nama_material} />}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="grid gap-3 md:hidden">
          {paginated.map((item) => {
            const menipis = item.stok < item.minimal_stok;
            return (
              <div key={item.id_material} className="space-y-2 rounded-2xl border p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold dark:text-slate-100">{item.nama_material}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.kode_material}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <MaterialDialog mode="edit" material={item} />
                    {canDelete && <MaterialDeleteDialog id={item.id_material} namaMaterial={item.nama_material} />}
                  </div>
                </div>
                <p className="text-sm dark:text-slate-300">Stok: <span className={`font-semibold ${menipis ? "text-red-600 dark:text-red-400" : ""}`}>{menipis && <AlertTriangle size={11} className="inline mr-0.5" />}{item.stok} {item.satuan}</span></p>
                <p className="text-sm font-semibold dark:text-slate-300">{formatRupiah(item.harga)}</p>
                <span className={`text-xs font-semibold ${item.kondisi === "BAIK" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>Kondisi: {item.kondisi === "BAIK" ? "Baik" : "Rusak"}</span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <MaterialPagination page={page} totalPages={totalPagesCalc} />
        </div>
      </CardContent>
    </Card>
  );
}
