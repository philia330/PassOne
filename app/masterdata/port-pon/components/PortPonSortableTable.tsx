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
import { PortPonFormDialog } from "./PortPonFormDialog";
import { DeletePortPonDialog } from "./DeletePortPonDialog";
import { PortPonSearch } from "./PortPonSearch";
import { PortPonPagination } from "./PortPonPagination";

type Olt = { id_olt: number; nama_olt: string };
type Odp = { id_odp: number; nama_odp: string };

const statusBadge: Record<string, string> = {
  TERSEDIA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  TERPASANG: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
  RUSAK: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
};

type PortPon = {
  id_port: number;
  nomor_port: number;
  tipe_kartu: string;
  status: "TERSEDIA" | "TERPASANG" | "RUSAK";
  id_olt: number;
  id_odp: number | null;
  olt?: { nama_olt: string };
  odp?: { nama_odp: string } | null;
};

const PAGE_SIZE = 10;

export function PortPonSortableTable({
  initialData,
  olts,
  odps,
  defaultValue,
}: {
  initialData: PortPon[];
  olts: Olt[];
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
      (port) =>
        (port.olt?.nama_olt?.toLowerCase().includes(query) ?? false) ||
        (port.odp?.nama_odp?.toLowerCase().includes(query) ?? false) ||
        port.tipe_kartu.toLowerCase().includes(query) ||
        port.status.toLowerCase().includes(query)
    );
  }, [initialData, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const result = a.nomor_port - b.nomor_port;
      return sortOrder === "asc" ? result : -result;
    });
  }, [filtered, sortOrder]);

  const totalPagesCalc = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card className="rounded-3xl border shadow-xl transition-all hover:shadow-2xl dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PortPonSearch defaultValue={search} />
          <PortPonFormDialog mode="create" olts={olts} odps={odps} />
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
                    OLT
                    {sortOrder === "asc" ? (
                      <ArrowUp size={16} className="text-purple-500" />
                    ) : (
                      <ArrowDown size={16} className="text-purple-500" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="dark:text-slate-300">Status</TableHead>
                <TableHead className="dark:text-slate-300">ODP Terhubung</TableHead>
                <TableHead className="text-center dark:text-slate-300">Nomor Port</TableHead>
                <TableHead className="dark:text-slate-300">Tipe Kartu</TableHead>
                <TableHead className="text-center dark:text-slate-300">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {search ? "Tidak ada data Port PON yang cocok" : "Belum ada data Port PON"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((port) => (
                  <TableRow key={port.id_port} className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                    <TableCell className="font-medium dark:text-slate-200">{port.olt?.nama_olt}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge[port.status] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{port.status}</span>
                    </TableCell>
                    <TableCell className="dark:text-slate-300">{port.odp?.nama_odp ?? "-"}</TableCell>
                    <TableCell className="text-center font-medium dark:text-slate-300">{port.nomor_port}</TableCell>
                    <TableCell className="dark:text-slate-300">{port.tipe_kartu}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <PortPonFormDialog mode="edit" olts={olts} odps={odps} data={{ id_port_pon: port.id_port, nomor_port: port.nomor_port, tipe_kartu: port.tipe_kartu, status: port.status, id_olt: port.id_olt, id_odp: port.id_odp }} />
                        <DeletePortPonDialog id={port.id_port} name={`${port.olt?.nama_olt} - Port ${port.nomor_port}`} />
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
          {paginated.map((port) => (
            <div key={port.id_port} className="space-y-2 rounded-2xl border p-4 dark:border-slate-800">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold dark:text-slate-100">{port.olt?.nama_olt}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Port {port.nomor_port} · {port.tipe_kartu}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <PortPonFormDialog mode="edit" olts={olts} odps={odps} data={{ id_port_pon: port.id_port, nomor_port: port.nomor_port, tipe_kartu: port.tipe_kartu, status: port.status, id_olt: port.id_olt, id_odp: port.id_odp }} />
                  <DeletePortPonDialog id={port.id_port} name={`${port.olt?.nama_olt} - Port ${port.nomor_port}`} />
                </div>
              </div>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusBadge[port.status] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{port.status}</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">ODP: {port.odp?.nama_odp ?? "-"}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <PortPonPagination page={page} totalPages={totalPagesCalc} />
        </div>
      </CardContent>
    </Card>
  );
}
