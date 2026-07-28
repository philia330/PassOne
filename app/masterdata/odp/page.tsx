import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Router, TriangleAlert } from "lucide-react";
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
import { requirePageAccess } from "@/lib/auth/guards";

// Ambang batas warning: stok >= 80% dari jumlah port dianggap hampir penuh
const WARNING_THRESHOLD = 0.8;

const getStokStatus = (stok: number | null, jumlah: number | null) => {
  if (!jumlah || jumlah <= 0) return null;
  const current = stok ?? 0;

  if (current >= jumlah) {
    return "penuh";
  }
  if (current / jumlah >= WARNING_THRESHOLD) {
    return "hampir-penuh";
  }
  return null;
};

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
    getOdps(search, page),
    getOlts(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data ODP"
        description="Kelola perangkat Optical Distribution Point (ODP)"
      />

      {/* Statistik */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total ODP</p>
              <h2 className="mt-2 text-5xl font-bold">{total}</h2>
              <p className="mt-1 text-sm text-white/80">Perangkat Terdaftar</p>
            </div>

            <div className="rounded-2xl bg-white/20 p-4">
              <Router className="h-8 w-8" />
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
                  <TableHead className="text-center dark:text-slate-300">Jumlah Port</TableHead>
                  <TableHead className="text-center dark:text-slate-300">Stok Port</TableHead>
                  <TableHead className="dark:text-slate-300">Dibuat</TableHead>
                  <TableHead className="text-right dark:text-slate-300">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {odps.map((odp) => {
                  const status = getStokStatus(odp.stok_port, odp.jumlah_port);

                  return (
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
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={
                              status === "penuh"
                                ? "font-semibold text-rose-600 dark:text-rose-400"
                                : status === "hampir-penuh"
                                ? "font-semibold text-amber-600 dark:text-amber-400"
                                : "dark:text-slate-400"
                            }
                          >
                            {odp.stok_port ?? 0}
                          </span>
                          {status === "penuh" && (
                            <TriangleAlert
                              className="h-4 w-4 text-rose-500"
                              aria-label="Port sudah penuh"
                            />
                          )}
                          {status === "hampir-penuh" && (
                            <TriangleAlert
                              className="h-4 w-4 text-amber-500"
                              aria-label="Port hampir penuh"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400">
                        {new Date(odp.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <OdpMapDialog
                            odpNama={odp.nama_odp}
                            odpLat={Number(odp.latitude)}
                            odpLng={Number(odp.longitude)}
                            oltNama={odp.olt?.nama_olt ?? "-"}
                            oltLat={Number(odp.olt?.latitude)}
                            oltLng={Number(odp.olt?.longitude)}
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
                              stok_port: odp.stok_port,
                            }}
                          />
                          <DeleteOdpDialog id={odp.id_odp} name={odp.nama_odp} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

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
            {odps.map((odp) => {
              const status = getStokStatus(odp.stok_port, odp.jumlah_port);

              return (
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
                        odpNama={odp.nama_odp}
                        odpLat={Number(odp.latitude)}
                        odpLng={Number(odp.longitude)}
                        oltNama={odp.olt?.nama_olt ?? "-"}
                        oltLat={Number(odp.olt?.latitude)}
                        oltLng={Number(odp.olt?.longitude)}
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
                          stok_port: odp.stok_port,
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
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <span>
                      Port: {odp.stok_port ?? 0} / {odp.jumlah_port ?? "-"}
                    </span>
                    {status === "penuh" && (
                      <TriangleAlert
                        className="h-3.5 w-3.5 text-rose-500"
                        aria-label="Port sudah penuh"
                      />
                    )}
                    {status === "hampir-penuh" && (
                      <TriangleAlert
                        className="h-3.5 w-3.5 text-amber-500"
                        aria-label="Port hampir penuh"
                      />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Dibuat:{" "}
                    {new Date(odp.createdAt).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              );
            })}

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