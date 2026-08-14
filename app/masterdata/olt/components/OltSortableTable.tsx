"use client";

import { useState, useMemo } from "react";
import { ArrowUp, ArrowDown, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OltFormDialog } from "./OltFormDialog";
import { DeleteOltDialog } from "./DeleteOltDialog";
import { OltSearch } from "./OltSearch";
import { OltPagination } from "./OltPagination";
import { OltMapDialog } from "./OltMapDialog";
import { OpenGoogleMaps } from "@/components/ui/OpenGoogleMaps";
import { OltSecretCell } from "./OltSecretCell";
import { OltImageDialog } from "./OltImageDialog";

type Olt = {
  id_olt: number;
  kode_olt: string;
  nama_olt: string;
  lokasi: string;
  latitude: string | number;
  longitude: string | number;
  id_pop: number;
  ip_olt?: string | null;
  username_olt?: string | null;
  password_olt?: string | null;
  foto_olt?: string | null;
  pop?: { nama_pop: string } | null;
  createdAt: Date;
};

const PAGE_SIZE = 10;

function LockedCell() {
  return (
    <span
      className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500"
      title="Hanya Admin/Leader yang bisa melihat data ini"
    >
      <Lock className="h-3.5 w-3.5" />
      <span className="text-xs">Terbatas</span>
    </span>
  );
}

export function OltSortableTable({
  initialData,
  pops,
  defaultValue,
  currentRole,
}: {
  initialData: Olt[];
  pops: { id_pop: number; nama_pop: string; alamat: string }[];
  defaultValue: string;
  currentRole: string;
}) {
  const canViewSecret = currentRole === "ADMIN" || currentRole === "LEADER";

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
      (olt) =>
        olt.kode_olt.toLowerCase().includes(query) ||
        olt.nama_olt.toLowerCase().includes(query) ||
        olt.lokasi.toLowerCase().includes(query) ||
        (olt.pop?.nama_pop?.toLowerCase().includes(query) ?? false)
    );
  }, [initialData, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const result = a.kode_olt.localeCompare(b.kode_olt, undefined, { numeric: true });
      return sortOrder === "asc" ? result : -result;
    });
  }, [filtered, sortOrder]);

  const totalPagesCalc = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card className="rounded-3xl border shadow-xl transition-all duration-300 hover:shadow-2xl dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <OltSearch defaultValue={search} />
          <div className="add-button">
            <OltFormDialog mode="create" pops={pops} />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto rounded-2xl border dark:border-slate-800 md:block table-container">
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
                <TableHead className="dark:text-slate-300">Foto</TableHead>
                <TableHead className="dark:text-slate-300">Nama OLT</TableHead>
                <TableHead className="dark:text-slate-300">Lokasi</TableHead>
                <TableHead className="dark:text-slate-300">POP</TableHead>
                <TableHead className="dark:text-slate-300">IP Address</TableHead>
                <TableHead className="dark:text-slate-300">Username</TableHead>
                <TableHead className="dark:text-slate-300">Password</TableHead>
                <TableHead className="dark:text-slate-300">Dibuat</TableHead>
                <TableHead className="text-center dark:text-slate-300">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {search ? "Tidak ada data OLT yang cocok" : "Belum ada data OLT"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((olt) => (
                  <TableRow
                    key={olt.id_olt}
                    className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 transition-colors duration-200"
                  >
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                      {olt.kode_olt}
                    </TableCell>
                    <TableCell>
                      <OltImageDialog fotoUrl={olt.foto_olt} namaOlt={olt.nama_olt} />
                    </TableCell>
                    <TableCell className="dark:text-slate-300">{olt.nama_olt}</TableCell>
                    <TableCell className="dark:text-slate-300">{olt.lokasi}</TableCell>
                    <TableCell className="dark:text-slate-300">{olt.pop?.nama_pop}</TableCell>
                    <TableCell>
                      {canViewSecret ? (
                        <OltSecretCell value={olt.ip_olt ?? null} />
                      ) : (
                        <LockedCell />
                      )}
                    </TableCell>
                    <TableCell>
                      {canViewSecret ? (
                        <OltSecretCell value={olt.username_olt ?? null} />
                      ) : (
                        <LockedCell />
                      )}
                    </TableCell>
                    <TableCell>
                      {canViewSecret ? (
                        <OltSecretCell value={olt.password_olt ?? null} />
                      ) : (
                        <LockedCell />
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">
                      {new Date(olt.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1 group/action">
                        <OltMapDialog nama={olt.nama_olt} lat={Number(olt.latitude)} lng={Number(olt.longitude)} />
                        <OpenGoogleMaps lat={Number(olt.latitude)} lng={Number(olt.longitude)} name={olt.nama_olt} />
                        <OltFormDialog mode="edit" pops={pops} data={{ id_olt: olt.id_olt, nama_olt: olt.nama_olt, lokasi: olt.lokasi, latitude: String(olt.latitude), longitude: String(olt.longitude), id_pop: olt.id_pop, ip_olt: olt.ip_olt, username_olt: olt.username_olt, password_olt: olt.password_olt, foto_olt: olt.foto_olt }} />
                        <DeleteOltDialog id={olt.id_olt} namaOlt={olt.nama_olt} />
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
              {search ? "Tidak ada data OLT yang cocok" : "Belum ada data OLT"}
            </div>
          ) : (
            paginated.map((olt) => (
              <div key={olt.id_olt} className="space-y-2 rounded-2xl border p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <OltImageDialog fotoUrl={olt.foto_olt} namaOlt={olt.nama_olt} />
                    <div>
                      <p className="font-semibold dark:text-slate-100">{olt.nama_olt}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{olt.kode_olt}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <OpenGoogleMaps lat={Number(olt.latitude)} lng={Number(olt.longitude)} name={olt.nama_olt} />
                    <OltFormDialog mode="edit" pops={pops} data={{ id_olt: olt.id_olt, nama_olt: olt.nama_olt, lokasi: olt.lokasi, latitude: String(olt.latitude), longitude: String(olt.longitude), id_pop: olt.id_pop, ip_olt: olt.ip_olt, username_olt: olt.username_olt, password_olt: olt.password_olt, foto_olt: olt.foto_olt }} />
                    <DeleteOltDialog id={olt.id_olt} namaOlt={olt.nama_olt} />
                  </div>
                </div>
                <p className="text-sm dark:text-slate-300">{olt.lokasi}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">POP: {olt.pop?.nama_pop ?? "-"}</p>

                <div className="space-y-1 border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 dark:text-slate-500">IP:</span>
                    {canViewSecret ? (
                      <OltSecretCell value={olt.ip_olt ?? null} />
                    ) : (
                      <LockedCell />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 dark:text-slate-500">Username:</span>
                    {canViewSecret ? (
                      <OltSecretCell value={olt.username_olt ?? null} />
                    ) : (
                      <LockedCell />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 dark:text-slate-500">Password:</span>
                    {canViewSecret ? (
                      <OltSecretCell value={olt.password_olt ?? null} />
                    ) : (
                      <LockedCell />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <OltPagination page={page} totalPages={totalPagesCalc} />
        </div>
      </CardContent>
    </Card>
  );
}