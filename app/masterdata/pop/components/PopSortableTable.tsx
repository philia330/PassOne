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
import { MapPin as MapPinIcon } from "lucide-react";
import { PopFormDialog } from "./PopFormDialog";
import { DeletePopDialog } from "./DeletePopDialog";
import { PopSearch } from "./PopSearch";
import { PopPagination } from "./PopPagination";
import { PopMapDialog } from "./PopMapDialog";
import { OpenGoogleMaps } from "@/components/ui/OpenGoogleMaps";

type Pop = {
  id_pop: number;
  kode_pop: string;
  nama_pop: string;
  alamat: string;
  id_area: number;
  latitude: number;
  longitude: number;
  area?: { nama_area: string };
  createdAt: Date;
};

const PAGE_SIZE = 10;

export function PopSortableTable({
  initialData,
  areas,
  defaultValue,
  canDelete = false,
}: {
  initialData: Pop[];
  areas: { id_area: number; nama_area: string }[];
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
      (pop) =>
        pop.kode_pop.toLowerCase().includes(query) ||
        pop.nama_pop.toLowerCase().includes(query) ||
        pop.alamat.toLowerCase().includes(query) ||
        (pop.area?.nama_area?.toLowerCase().includes(query) ?? false)
    );
  }, [initialData, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const result = a.kode_pop.localeCompare(b.kode_pop, undefined, { numeric: true });
      return sortOrder === "asc" ? result : -result;
    });
  }, [filtered, sortOrder]);

  const totalPagesCalc = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card className="rounded-3xl border shadow-xl transition-all hover:shadow-2xl dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PopSearch defaultValue={search} />
          <PopFormDialog mode="create" areas={areas} />
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
                <TableHead className="dark:text-slate-300">Nama POP</TableHead>
                <TableHead className="dark:text-slate-300">Alamat</TableHead>
                <TableHead className="dark:text-slate-300">Area</TableHead>
                <TableHead className="dark:text-slate-300">Dibuat</TableHead>
                <TableHead className="text-center dark:text-slate-300">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {search ? "Tidak ada data POP yang cocok" : "Belum ada data POP"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((pop) => (
                  <TableRow
                    key={pop.id_pop}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/70 dark:border-slate-800"
                  >
                    <TableCell className="font-medium dark:text-slate-200">
                      {pop.kode_pop}
                    </TableCell>
                    <TableCell className="dark:text-slate-300">{pop.nama_pop}</TableCell>
                    <TableCell className="dark:text-slate-300">{pop.alamat}</TableCell>
                    <TableCell className="dark:text-slate-300">{pop.area?.nama_area}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">
                      {new Date(pop.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
<TableCell className="text-center">
  <div className="flex justify-center gap-1">
    <PopMapDialog
      nama={pop.nama_pop}
      lat={Number(pop.latitude)}
      lng={Number(pop.longitude)}
    />
    <OpenGoogleMaps
      lat={Number(pop.latitude)}
      lng={Number(pop.longitude)}
      name={pop.nama_pop}
    />
    <PopFormDialog
      mode="edit"
      areas={areas}
      data={{
        id_pop: pop.id_pop,
        nama_pop: pop.nama_pop,
        alamat: pop.alamat,
        id_area: pop.id_area,
        latitude: pop.latitude,
        longitude: pop.longitude,
      }}
    />
    {canDelete && <DeletePopDialog id={pop.id_pop} name={pop.nama_pop} />}
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
              {search ? "Tidak ada data POP yang cocok" : "Belum ada data POP"}
            </div>
          ) : (
            paginated.map((pop) => (
              <div key={pop.id_pop} className="space-y-2 rounded-2xl border p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold dark:text-white">{pop.nama_pop}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">{pop.kode_pop}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
  <PopMapDialog
    nama={pop.nama_pop}
    lat={Number(pop.latitude)}
    lng={Number(pop.longitude)}
  />
  <OpenGoogleMaps
    lat={Number(pop.latitude)}
    lng={Number(pop.longitude)}
    name={pop.nama_pop}
  />
  <PopFormDialog
    mode="edit"
    areas={areas}
    data={{
      id_pop: pop.id_pop,
      nama_pop: pop.nama_pop,
      alamat: pop.alamat,
      id_area: pop.id_area,
      latitude: pop.latitude,
      longitude: pop.longitude,
    }}
  />
  {canDelete && <DeletePopDialog id={pop.id_pop} name={pop.nama_pop} />}
</div>
                </div>
                <p className="flex items-start gap-1 text-sm text-slate-600 dark:text-slate-300">
                  <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                  {pop.alamat}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Area: {pop.area?.nama_area}</p>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <PopPagination page={page} totalPages={totalPagesCalc} />
        </div>
      </CardContent>
    </Card>
  );
}
