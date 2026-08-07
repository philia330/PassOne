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
import { OdpFormDialog } from "./OdpFormDialog";
import { DeleteOdpDialog } from "./DeleteOdpDialog";
import { OdpSearch } from "./OdpSearch";
import { OdpPagination } from "./OdpPagination";
import { OdpMapDialog } from "./OdpMapDialog";
import { OdpConnectionDialog } from "./OdpConnectionDialog";

type Olt = { id_olt: number; nama_olt: string };

type Odp = {
  id_odp: number;
  kode_odp: string;
  nama_odp: string;
  alamat: string;
  latitude: string | number;
  longitude: string | number;
  id_olt: number;
  jumlah_port?: number | null;
  olt?: { nama_olt: string };
  _count?: { ont: number; baa: number };
};

const PAGE_SIZE = 10;

export function OdpSortableTable({
  initialData,
  olts,
  defaultValue,
}: {
  initialData: Odp[];
  olts: Olt[];
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
      (odp) =>
        odp.kode_odp.toLowerCase().includes(query) ||
        odp.nama_odp.toLowerCase().includes(query) ||
        odp.alamat.toLowerCase().includes(query) ||
        (odp.olt?.nama_olt?.toLowerCase().includes(query) ?? false)
    );
  }, [initialData, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const result = a.kode_odp.localeCompare(b.kode_odp, undefined, { numeric: true });
      return sortOrder === "asc" ? result : -result;
    });
  }, [filtered, sortOrder]);

  const totalPagesCalc = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card className="rounded-3xl border shadow-xl transition-all hover:shadow-2xl dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <OdpSearch defaultValue={search} />
          <OdpFormDialog mode="create" olts={olts} />
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
                <TableHead className="dark:text-slate-300">Nama ODP</TableHead>
                <TableHead className="dark:text-slate-300">Alamat</TableHead>
                <TableHead className="dark:text-slate-300">OLT</TableHead>
                <TableHead className="text-center dark:text-slate-300">Port</TableHead>
                <TableHead className="text-center dark:text-slate-300">Terhubung</TableHead>
                <TableHead className="text-center dark:text-slate-300">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {search ? "Tidak ada data ODP yang cocok" : "Belum ada data ODP"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((odp) => (
                  <TableRow key={odp.id_odp} className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                    <TableCell className="font-medium dark:text-slate-200">{odp.kode_odp}</TableCell>
                    <TableCell className="dark:text-slate-300">{odp.nama_odp}</TableCell>
                    <TableCell className="dark:text-slate-300">{odp.alamat}</TableCell>
                    <TableCell className="dark:text-slate-300">{odp.olt?.nama_olt}</TableCell>
                    <TableCell className="text-center dark:text-slate-400">{odp.jumlah_port ?? "-"}</TableCell>
                    <TableCell className="text-center">
                      {odp._count && (
                        <OdpConnectionDialog
                          odpId={odp.id_odp}
                          odpName={odp.nama_odp}
                          trigger={
                            <span className="cursor-pointer inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium">
                              <span>{odp._count?.ont || 0} ONT</span>
                              <span className="text-slate-400">+</span>
                              <span>{odp._count?.baa || 0} BAA</span>
                            </span>
                          }
                        />
                      )}
                      {!odp._count && <span className="text-slate-400">-</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <OdpMapDialog currentId={odp.id_odp} odpNama={odp.nama_odp} allPoints={[]} />
                        <OdpFormDialog mode="edit" olts={olts} data={{ id_odp: odp.id_odp, nama_odp: odp.nama_odp, alamat: odp.alamat, latitude: String(odp.latitude), longitude: String(odp.longitude), id_olt: odp.id_olt, jumlah_port: odp.jumlah_port }} />
                        <DeleteOdpDialog id={odp.id_odp} name={odp.nama_odp} />
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
          {paginated.map((odp) => (
            <div key={odp.id_odp} className="space-y-2 rounded-2xl border p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold dark:text-slate-100">{odp.nama_odp}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{odp.kode_odp}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <OdpFormDialog mode="edit" olts={olts} data={{ id_odp: odp.id_odp, nama_odp: odp.nama_odp, alamat: odp.alamat, latitude: String(odp.latitude), longitude: String(odp.longitude), id_olt: odp.id_olt, jumlah_port: odp.jumlah_port }} />
                  <DeleteOdpDialog id={odp.id_odp} name={odp.nama_odp} />
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{odp.alamat}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">OLT: {odp.olt?.nama_olt ?? "-"}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <OdpPagination page={page} totalPages={totalPagesCalc} />
        </div>
      </CardContent>
    </Card>
  );
}
