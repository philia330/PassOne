"use client";

import { useState, useMemo } from "react";
import { Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUp, ArrowDown } from "lucide-react";
import { AreaFormDialog } from "./AreaFormDialog";
import { DeleteAreaDialog } from "./DeleteAreaDialog";
import { AreaSearch } from "./AreaSearch";
import { AreaPagination } from "./AreaPagination";

type Area = {
  id_area: number;
  kode_area: string;
  nama_area: string;
  keterangan: string | null;
  createdAt: Date;
};

const PAGE_SIZE = 10;

export function AreaSortableTable({
  initialData,
  total,
  totalPages,
  defaultValue,
}: {
  initialData: Area[];
  total: number;
  totalPages: number;
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
      (area) =>
        area.kode_area.toLowerCase().includes(query) ||
        area.nama_area.toLowerCase().includes(query) ||
        (area.keterangan?.toLowerCase().includes(query) ?? false)
    );
  }, [initialData, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const result = a.kode_area.localeCompare(b.kode_area, undefined, { numeric: true });
      return sortOrder === "asc" ? result : -result;
    });
  }, [filtered, sortOrder]);

  const totalPagesCalc = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card className="rounded-3xl border shadow-xl transition-all hover:shadow-2xl dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <AreaSearch defaultValue={search} />
          <AreaFormDialog mode="create" />
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto rounded-2xl border dark:border-slate-800 md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50">
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
                <TableHead className="dark:text-slate-300">Nama Area</TableHead>
                <TableHead className="dark:text-slate-300">Keterangan</TableHead>
                <TableHead className="dark:text-slate-300">Dibuat</TableHead>
                <TableHead className="text-center dark:text-slate-300">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {search ? "Tidak ada data Area yang cocok" : "Belum ada data Area"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((area) => (
                  <TableRow
                    key={area.id_area}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-800"
                  >
                    <TableCell className="font-medium dark:text-slate-200">
                      {area.kode_area}
                    </TableCell>
                    <TableCell className="dark:text-slate-300">{area.nama_area}</TableCell>
                    <TableCell className="dark:text-slate-300">{area.keterangan ?? "-"}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">
                      {new Date(area.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <AreaFormDialog
                          mode="edit"
                          data={{
                            id_area: area.id_area,
                            nama_area: area.nama_area,
                            keterangan: area.keterangan,
                          }}
                        />
                        <DeleteAreaDialog id={area.id_area} namaArea={area.nama_area} />
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
          {paginated.length === 0 ? (
            <div className="rounded-2xl border py-10 text-center text-slate-400 dark:border-slate-800 dark:text-slate-500">
              {search ? "Tidak ada data Area yang cocok" : "Belum ada data Area"}
            </div>
          ) : (
            paginated.map((area) => (
              <div
                key={area.id_area}
                className="space-y-2 rounded-2xl border p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold dark:text-slate-100">{area.nama_area}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">{area.kode_area}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <AreaFormDialog
                      mode="edit"
                      data={{
                        id_area: area.id_area,
                        nama_area: area.nama_area,
                        keterangan: area.keterangan,
                      }}
                    />
                    <DeleteAreaDialog id={area.id_area} namaArea={area.nama_area} />
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{area.keterangan ?? "-"}</p>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <AreaPagination page={page} totalPages={totalPagesCalc} />
        </div>
      </CardContent>
    </Card>
  );
}
