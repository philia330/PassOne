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
import { OntFormDialog } from "./OntFormDialog";
import { DeleteOntDialog } from "./DeleteOntDialog";
import { OntSearch } from "./OntSearch";
import { OntPagination } from "./OntPagination";

type Pop = { id_pop: number; nama_pop: string };
type Odp = { id_odp: number; nama_odp: string };

const statusBadge: Record<string, string> = {
  TERSEDIA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  TERPASANG: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400",
  RUSAK: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
};

type Ont = {
  id_ont: number;
  serial_number: string;
  pelanggan: string;
  status: "TERSEDIA" | "TERPASANG" | "RUSAK";
  id_pop: number | null;
  id_odp: number | null;
  pop?: { nama_pop: string };
  odp?: { nama_odp: string };
  createdAt: Date;
};

const PAGE_SIZE = 10;

export function OntSortableTable({
  initialData,
  pops,
  odps,
  defaultValue,
}: {
  initialData: Ont[];
  pops: Pop[];
  odps: Odp[];
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
      (ont) =>
        ont.serial_number.toLowerCase().includes(query) ||
        ont.pelanggan.toLowerCase().includes(query) ||
        (ont.pop?.nama_pop?.toLowerCase().includes(query) ?? false) ||
        (ont.odp?.nama_odp?.toLowerCase().includes(query) ?? false)
    );
  }, [initialData, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const result = a.serial_number.localeCompare(b.serial_number, undefined, { numeric: true });
      return sortOrder === "asc" ? result : -result;
    });
  }, [filtered, sortOrder]);

  const totalPagesCalc = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card className="rounded-3xl border shadow-xl transition-all hover:shadow-2xl dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <OntSearch defaultValue={search} />
          <OntFormDialog mode="create" pops={pops} odps={odps} />
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
                    Serial Number
                    {sortOrder === "asc" ? (
                      <ArrowUp size={16} className="text-purple-500" />
                    ) : (
                      <ArrowDown size={16} className="text-purple-500" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="dark:text-slate-300">Pelanggan</TableHead>
                <TableHead className="dark:text-slate-300">Status</TableHead>
                <TableHead className="dark:text-slate-300">POP</TableHead>
                <TableHead className="dark:text-slate-300">ODP</TableHead>
                <TableHead className="dark:text-slate-300">Dibuat</TableHead>
                <TableHead className="text-center dark:text-slate-300">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {search ? "Tidak ada data ONT yang cocok" : "Belum ada data ONT"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((ont) => (
                  <TableRow key={ont.id_ont} className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                    <TableCell className="font-medium dark:text-slate-200">{ont.serial_number}</TableCell>
                    <TableCell className="dark:text-slate-300">{ont.pelanggan}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge[ont.status]}`}>{ont.status}</span>
                    </TableCell>
                    <TableCell className="dark:text-slate-300">{ont.pop?.nama_pop}</TableCell>
                    <TableCell className="dark:text-slate-300">{ont.odp?.nama_odp}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">
                      {new Date(ont.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <OntFormDialog mode="edit" pops={pops} odps={odps} data={{ id_ont: ont.id_ont, serial_number: ont.serial_number, pelanggan: ont.pelanggan, status: ont.status, id_pop: ont.id_pop, id_odp: ont.id_odp }} />
                        <DeleteOntDialog id={ont.id_ont} name={ont.serial_number} />
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
          {paginated.map((ont) => (
            <div key={ont.id_ont} className="space-y-2 rounded-2xl border p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold dark:text-slate-100">{ont.serial_number}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{ont.pelanggan}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <OntFormDialog mode="edit" pops={pops} odps={odps} data={{ id_ont: ont.id_ont, serial_number: ont.serial_number, pelanggan: ont.pelanggan, status: ont.status, id_pop: ont.id_pop, id_odp: ont.id_odp }} />
                  <DeleteOntDialog id={ont.id_ont} name={ont.serial_number} />
                </div>
              </div>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusBadge[ont.status]}`}>{ont.status}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <OntPagination page={page} totalPages={totalPagesCalc} />
        </div>
      </CardContent>
    </Card>
  );
}
