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
import { OdpSortToggle } from "./components/OdpSortToggle";
import { OpenGoogleMaps } from "@/components/ui/OpenGoogleMaps";
import { requirePageAccess } from "@/lib/auth/guards";
import { ExportButton } from "@/components/ui/ExportButton";

export default async function OdpPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
    sort?: string;
  }>;
}) {
  const session = await requirePageAccess(["ADMIN", "LEADER"]);

  const params = (await searchParams) ?? {};

  const search = params.search ?? "";
  const page = Number(params.page ?? 1);
  const sortOrder: "asc" | "desc" = params.sort === "desc" ? "desc" : "asc";

  const currentRole = session.user.role as string;
  const canDelete = currentRole === "ADMIN" || currentRole === "LEADER";

  // Hanya Admin dan Leader yang bisa export
  const canExport = currentRole === "ADMIN" || currentRole === "LEADER";

  const [{ data: odps, total, totalPages }, olts] = await Promise.all([
    getOdps(search, page, true, sortOrder),
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
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total ODP</p>
              <h2 className="mt-2 text-4xl font-bold">{total}</h2>
              <p className="mt-1 text-sm text-white/80">Perangkat Terdaftar</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-4">
              <Router className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total ONT</p>
              <h2 className="mt-2 text-4xl font-bold">
                {odps.reduce((sum, o) => sum + ((o as any)._count?.ont || 0), 0)}
              </h2>
              <p className="mt-1 text-sm text-white/80">ONT Terpasang</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-4">
              <Wifi className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total BAA</p>
              <h2 className="mt-2 text-4xl font-bold">
                {odps.reduce((sum, o) => sum + ((o as any)._count?.baa || 0), 0)}
              </h2>
              <p className="mt-1 text-sm text-white/80">BAA Terbuat</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-4">
              <FileText className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table & Content Card */}
      <Card className="rounded-3xl border border-slate-200 bg-white shadow-xl transition-all duration-300 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="space-y-6 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <OdpSearch defaultValue={search} />
            <div className="flex items-center gap-2">
              {canExport && <ExportButton apiUrl="/api/odp/export" filenamePrefix="Export_ODP" />}
              <OdpFormDialog mode="create" olts={olts} />
            </div>
          </div>

          {/* ====================================================== */}
          {/* Versi Tabel - hanya muncul di layar medium ke atas (md:) */}
          {/* ====================================================== */}
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 md:block table-container">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  <TableHead className="dark:text-slate-300">
                    <OdpSortToggle sortOrder={sortOrder} />
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
                {odps.map((odp) => (
                  <TableRow
                    key={odp.id_odp}
                    className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 transition-colors duration-200"
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
                            <span className="cursor-pointer inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium group">
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
                      <div className="flex justify-center gap-1 group/action">
                        <OdpMapDialog
                          currentId={odp.id_odp}
                          odpNama={odp.nama_odp}
                          allPoints={allPoints}
                        />
                        <OpenGoogleMaps
                          lat={Number(odp.latitude)}
                          lng={Number(odp.longitude)}
                          name={odp.nama_odp}
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
                        {canDelete && <DeleteOdpDialog id={odp.id_odp} namaOdp={odp.nama_odp} />}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {odps.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
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
          <div className="md:hidden flex justify-end">
            <OdpSortToggle sortOrder={sortOrder} />
          </div>

          <div className="grid gap-3 md:hidden animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {odps.map((odp) => (
              <div
                key={odp.id_odp}
                className="space-y-2 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-800/40 transition-all duration-200 hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-800/50 active:scale-[0.99]"
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
                  <div className="flex shrink-0 gap-1 group/action">
                    <OdpMapDialog
                      currentId={odp.id_odp}
                      odpNama={odp.nama_odp}
                      allPoints={allPoints}
                    />
                    <OpenGoogleMaps
                      lat={Number(odp.latitude)}
                      lng={Number(odp.longitude)}
                      name={odp.nama_odp}
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
                    {canDelete && <DeleteOdpDialog id={odp.id_odp} namaOdp={odp.nama_odp} />}
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