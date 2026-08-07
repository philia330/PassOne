import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Router, Wifi, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getOdps, getOlts } from "./actions";

import { OdpFormDialog } from "./components/OdpFormDialog";
import { DeleteOdpDialog } from "./components/DeleteOdpDialog";
import { OdpMapDialog } from "./components/OdpMapDialog";
import { OdpSearch } from "./components/OdpSearch";
import { OdpPagination } from "./components/OdpPagination";
import { OdpConnectionDialog } from "./components/OdpConnectionDialog";
import { requirePageAccess } from "@/lib/auth/guards";

export default async function OdpPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}) {
  const session = await requirePageAccess(["ADMIN", "LEADER"]);

  const params = await searchParams;

  const search = params.search ?? "";
  const page = Number(params.page ?? 1);

  const [{ data: odps, total, totalPages }, olts] = await Promise.all([
    getOdps(search, page, true), // true = include counts
    getOlts(),
  ]);

  const allPoints = odps.map((o) => ({
    id_odp: o.id_odp,
    odpNama: o.nama_odp,
    odpLat: Number(o.latitude),
    odpLng: Number(o.longitude),
    oltNama: o.olt?.nama_olt ?? "-",
    oltLat: Number(o.olt?.latitude ?? 0),
    oltLng: Number(o.olt?.longitude ?? 0),
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data ODP"
        description="Kelola perangkat Optical Distribution Point (ODP)"
      />

      {/* Statistik */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-600 text-white shadow-lg shadow-purple-500/20 overflow-hidden relative">
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/5" />
          <CardContent className="flex items-center justify-between p-6 relative">
            <div>
              <p className="text-sm text-white/80 font-medium">Total ODP</p>
              <h2 className="mt-2 text-5xl font-bold tracking-tight">{total}</h2>
              <p className="mt-1 text-xs text-white/60">Perangkat Terdaftar</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
              <Router className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-sky-50 shadow-md dark:border-blue-900/30 dark:from-blue-950 dark:to-sky-950 overflow-hidden relative">
          <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-blue-200/30 dark:bg-blue-800/20" />
          <CardContent className="flex items-center justify-between p-6 relative">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total ONT</p>
              <h2 className="mt-2 text-4xl font-bold text-blue-700 dark:text-blue-300 tracking-tight">
                {odps.reduce((sum, o) => sum + ((o as any)._count?.ont || 0), 0)}
              </h2>
              <p className="mt-1 text-xs text-blue-500/70 dark:text-blue-400/50">ONT Terpasang</p>
            </div>
            <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/50">
              <Wifi className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md dark:border-green-900/30 dark:from-green-950 dark:to-emerald-950 overflow-hidden relative">
          <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-green-200/30 dark:bg-green-800/20" />
          <CardContent className="flex items-center justify-between p-6 relative">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total BAA</p>
              <h2 className="mt-2 text-4xl font-bold text-green-700 dark:text-green-300 tracking-tight">
                {odps.reduce((sum, o) => sum + ((o as any)._count?.baa || 0), 0)}
              </h2>
              <p className="mt-1 text-xs text-green-500/70 dark:text-green-400/50">BAA Terbuat</p>
            </div>
            <div className="rounded-xl bg-green-100 p-3 dark:bg-green-900/50">
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table & Content Card */}
      <Card className="rounded-3xl border border-slate-200 bg-white shadow-xl transition-all hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="space-y-6 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <OdpSearch defaultValue={search} />
            <OdpFormDialog mode="create" olts={olts} />
          </div>

          {/* ====================================================== */}
          {/* Versi Tabel - hanya muncul di layar medium ke atas (md:) */}
          {/* ====================================================== */}
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  <TableHead className="dark:text-slate-300">Kode ODP</TableHead>
                  <TableHead className="dark:text-slate-300">Nama ODP</TableHead>
                  <TableHead className="dark:text-slate-300">Alamat</TableHead>
                  <TableHead className="dark:text-slate-300">OLT</TableHead>
                  <TableHead className="text-center dark:text-slate-300">Port</TableHead>
                  <TableHead className="text-center dark:text-slate-300">Terhubung</TableHead>
                  <TableHead className="text-center dark:text-slate-300">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {odps.map((odp) => (
                  <TableRow
                    key={odp.id_odp}
                    className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="font-medium dark:text-slate-200">
                      {odp.kode_odp}
                    </TableCell>
                    <TableCell className="dark:text-slate-300">{odp.nama_odp}</TableCell>
                    <TableCell className="dark:text-slate-300">{odp.alamat}</TableCell>
                    <TableCell className="dark:text-slate-300">{odp.olt?.nama_olt}</TableCell>
                    <TableCell className="text-center dark:text-slate-400">
                      {odp.jumlah_port ?? "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {(odp as any)._count && (
                        <OdpConnectionDialog
                          odpId={odp.id_odp}
                          odpName={odp.nama_odp}
                          trigger={
                            <span className="cursor-pointer inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium">
                              <span>{(odp as any)._count?.ont || 0} ONT</span>
                              <span className="text-slate-400">+</span>
                              <span>{(odp as any)._count?.baa || 0} BAA</span>
                            </span>
                          }
                        />
                      )}
                      {!(odp as any)._count && (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <OdpMapDialog
                          currentId={odp.id_odp}
                          odpNama={odp.nama_odp}
                          allPoints={allPoints}
                        />
                        <OdpFormDialog
                          mode="edit"
                          olts={olts}
                          data={{
                            id_odp: odp.id_odp,
                            nama_odp: odp.nama_odp,
                            alamat: odp.alamat,
                            latitude: odp.latitude.toString(),
                            longitude: odp.longitude.toString(),
                            id_olt: odp.id_olt,
                            jumlah_port: odp.jumlah_port,
                          }}
                        />
                        <DeleteOdpDialog id={odp.id_odp} name={odp.nama_odp} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {odps.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-slate-400 dark:text-slate-500"
                    >
                      {search
                        ? "Tidak ada data ODP yang cocok dengan pencarian"
                        : "Belum ada data ODP"}
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
            {odps.map((odp) => (
              <div
                key={odp.id_odp}
                className="space-y-2 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {odp.nama_odp}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {odp.kode_odp}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <OdpMapDialog
                      currentId={odp.id_odp}
                      odpNama={odp.nama_odp}
                      allPoints={allPoints}
                    />
                    <OdpFormDialog
                      mode="edit"
                      olts={olts}
                      data={{
                        id_odp: odp.id_odp,
                        nama_odp: odp.nama_odp,
                        alamat: odp.alamat,
                        latitude: odp.latitude.toString(),
                        longitude: odp.longitude.toString(),
                        id_olt: odp.id_olt,
                        jumlah_port: odp.jumlah_port,
                      }}
                    />
                    <DeleteOdpDialog id={odp.id_odp} name={odp.nama_odp} />
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {odp.alamat}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  OLT: {odp.olt?.nama_olt ?? "-"}
                </p>
                <div className="flex items-center gap-4">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Port: {odp.jumlah_port ?? "-"}
                  </p>
                  {(odp as any)._count && (
                    <OdpConnectionDialog
                      odpId={odp.id_odp}
                      odpName={odp.nama_odp}
                      trigger={
                        <span className="cursor-pointer text-xs text-purple-600 hover:text-purple-800 font-medium">
                          {(odp as any)._count?.ont || 0} ONT + {(odp as any)._count?.baa || 0} BAA
                        </span>
                      }
                    />
                  )}
                </div>
              </div>
            ))}

            {odps.length === 0 && (
              <div className="rounded-2xl border border-slate-200 py-10 text-center text-slate-400 dark:border-slate-800 dark:text-slate-500">
                {search
                  ? "Tidak ada data ODP yang cocok dengan pencarian"
                  : "Belum ada data ODP"}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <OdpPagination page={page} totalPages={totalPages} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}