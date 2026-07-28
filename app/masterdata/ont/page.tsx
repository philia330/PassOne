import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Router } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getOnts, getPops, getOdps } from "./actions";

import { OntFormDialog } from "./components/OntFormDialog";
import { DeleteOntDialog } from "./components/DeleteOntDialog";
import { OntSearch } from "./components/OntSearch";
import { OntPagination } from "./components/OntPagination";
import { requirePageAccess } from "@/lib/auth/guards";

const statusBadge: Record<string, string> = {
  TERSEDIA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  TERPASANG: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400",
  RUSAK: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
};

export default async function OntPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await requirePageAccess(["ADMIN", "LOGISTIK"]);

  const params = await searchParams;
  const search = params.search ?? "";
  const page = Number(params.page ?? 1);

  const [{ data: onts, total, totalPages }, pops, odps] = await Promise.all([
    getOnts(search, page),
    getPops(),
    getOdps(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data ONT"
        description="Kelola perangkat Optical Network Terminal (ONT) pelanggan"
      />

      {/* Stats Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total ONT</p>
              <h2 className="mt-2 text-4xl font-bold">{total}</h2>
              <p className="mt-1 text-sm text-white/80">Perangkat Terdaftar</p>
            </div>

            <div className="rounded-2xl bg-white/20 p-4">
              <Router className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="rounded-3xl border border-slate-200 bg-white shadow-xl transition-all hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="space-y-6 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <OntSearch defaultValue={search} />
            <OntFormDialog mode="create" pops={pops} odps={odps} />
          </div>

          {/* ====================================================== */}
          {/* Versi Tabel - hanya muncul di layar medium ke atas (md:) */}
          {/* ====================================================== */}
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  <TableHead className="dark:text-slate-300">Serial Number</TableHead>
                  <TableHead className="dark:text-slate-300">Pelanggan</TableHead>
                  <TableHead className="dark:text-slate-300">Status</TableHead>
                  <TableHead className="dark:text-slate-300">POP</TableHead>
                  <TableHead className="dark:text-slate-300">ODP</TableHead>
                  <TableHead className="dark:text-slate-300">Dibuat</TableHead>
                  <TableHead className="text-right dark:text-slate-300">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {onts.map((ont) => (
                  <TableRow
                    key={ont.id_ont}
                    className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="font-medium dark:text-slate-200">
                      {ont.serial_number}
                    </TableCell>
                    <TableCell className="dark:text-slate-300">{ont.pelanggan}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge[ont.status]}`}
                      >
                        {ont.status}
                      </span>
                    </TableCell>
                    <TableCell className="dark:text-slate-300">{ont.pop?.nama_pop}</TableCell>
                    <TableCell className="dark:text-slate-300">{ont.odp?.nama_odp}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">
                      {new Date(ont.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <OntFormDialog
                          mode="edit"
                          pops={pops}
                          odps={odps}
                          data={{
                            id_ont: ont.id_ont,
                            serial_number: ont.serial_number,
                            pelanggan: ont.pelanggan,
                            status: ont.status,
                            id_pop: ont.id_pop,
                            id_odp: ont.id_odp,
                          }}
                        />
                        <DeleteOntDialog
                          id={ont.id_ont}
                          name={ont.serial_number}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {onts.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-slate-400 dark:text-slate-500"
                    >
                      {search
                        ? "Tidak ada data ONT yang cocok dengan pencarian"
                        : "Belum ada data ONT"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ====================================================== */}
          {/* Versi Card - hanya muncul di HP (di bawah breakpoint md:) */}
          {/* ====================================================== */}
          <div className="grid gap-3 md:hidden">
            {onts.map((ont) => (
              <div
                key={ont.id_ont}
                className="space-y-2 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {ont.serial_number}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {ont.pelanggan}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <OntFormDialog
                      mode="edit"
                      pops={pops}
                      odps={odps}
                      data={{
                        id_ont: ont.id_ont,
                        serial_number: ont.serial_number,
                        pelanggan: ont.pelanggan,
                        status: ont.status,
                        id_pop: ont.id_pop,
                        id_odp: ont.id_odp,
                      }}
                    />
                    <DeleteOntDialog
                      id={ont.id_ont}
                      name={ont.serial_number}
                    />
                  </div>
                </div>

                <div>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusBadge[ont.status]}`}
                  >
                    {ont.status}
                  </span>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  POP: {ont.pop?.nama_pop ?? "-"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  ODP: {ont.odp?.nama_odp ?? "-"}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Dibuat:{" "}
                  {new Date(ont.createdAt).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}

            {onts.length === 0 && (
              <div className="rounded-2xl border border-slate-200 py-10 text-center text-slate-400 dark:border-slate-800 dark:text-slate-500">
                {search
                  ? "Tidak ada data ONT yang cocok dengan pencarian"
                  : "Belum ada data ONT"}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <OntPagination page={page} totalPages={totalPages} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}