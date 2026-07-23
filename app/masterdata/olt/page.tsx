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
import { getOlts, getPops } from "./actions";
import { OltFormDialog } from "./components/OltFormDialog";
import { DeleteOltDialog } from "./components/DeleteOltDialog";
import { OltSearch } from "./components/OltSearch";
import { OltPagination } from "./components/OltPagination";
import { OltMapDialog } from "./components/OltMapDialog";

export default async function OltPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;

  const search = params.search ?? "";
  const page = Number(params.page ?? 1);

  const [{ data: olts, total, totalPages }, pops] = await Promise.all([
    getOlts(search, page),
    getPops(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data OLT"
        description="Kelola perangkat Optical Line Terminal (OLT) di setiap POP"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total OLT</p>
              <h2 className="mt-2 text-4xl font-bold">{total}</h2>
              <p className="mt-1 text-sm text-white/80">Perangkat Terdaftar</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-4">
              <Router className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border border-slate-200 bg-white shadow-xl transition-all hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="space-y-6 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <OltSearch defaultValue={search} />
            <OltFormDialog mode="create" pops={pops} />
          </div>

          {/* ====================================================== */}
          {/* Versi Tabel - hanya muncul di layar medium ke atas (md:) */}
          {/* ====================================================== */}
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800/60">
                  <TableHead className="dark:text-slate-300">Kode OLT</TableHead>
                  <TableHead className="dark:text-slate-300">Nama OLT</TableHead>
                  <TableHead className="dark:text-slate-300">Lokasi</TableHead>
                  <TableHead className="dark:text-slate-300">POP</TableHead>
                  <TableHead className="dark:text-slate-300">Latitude</TableHead>
                  <TableHead className="dark:text-slate-300">Longitude</TableHead>
                  <TableHead className="text-right dark:text-slate-300">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {olts.map((olt) => (
                  <TableRow
                    key={olt.id_olt}
                    className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                      {olt.kode_olt}
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300">
                      {olt.nama_olt}
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300">
                      {olt.lokasi}
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300">
                      {olt.pop?.nama_pop}
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300">
                      {olt.latitude.toString()}
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300">
                      {olt.longitude.toString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <OltMapDialog
                          nama={olt.nama_olt}
                          lat={Number(olt.latitude)}
                          lng={Number(olt.longitude)}
                        />
                        <OltFormDialog
                          mode="edit"
                          pops={pops}
                          data={{
                            id_olt: olt.id_olt,
                            nama_olt: olt.nama_olt,
                            lokasi: olt.lokasi,
                            latitude: olt.latitude.toString(),
                            longitude: olt.longitude.toString(),
                            id_pop: olt.id_pop,
                          }}
                        />
                        <DeleteOltDialog id={olt.id_olt} name={olt.nama_olt} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {olts.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-slate-400 dark:text-slate-500"
                    >
                      {search
                        ? "Tidak ada data OLT yang cocok dengan pencarian"
                        : "Belum ada data OLT"}
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
            {olts.map((olt) => (
              <div
                key={olt.id_olt}
                className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {olt.nama_olt}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {olt.kode_olt}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <OltMapDialog
                      nama={olt.nama_olt}
                      lat={Number(olt.latitude)}
                      lng={Number(olt.longitude)}
                    />
                    <OltFormDialog
                      mode="edit"
                      pops={pops}
                      data={{
                        id_olt: olt.id_olt,
                        nama_olt: olt.nama_olt,
                        lokasi: olt.lokasi,
                        latitude: olt.latitude.toString(),
                        longitude: olt.longitude.toString(),
                        id_pop: olt.id_pop,
                      }}
                    />
                    <DeleteOltDialog id={olt.id_olt} name={olt.nama_olt} />
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {olt.lokasi}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  POP: {olt.pop?.nama_pop ?? "-"}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {olt.latitude.toString()}, {olt.longitude.toString()}
                </p>
              </div>
            ))}

            {olts.length === 0 && (
              <div className="rounded-2xl border border-slate-200 py-10 text-center text-slate-400 dark:border-slate-800 dark:text-slate-500">
                {search
                  ? "Tidak ada data OLT yang cocok dengan pencarian"
                  : "Belum ada data OLT"}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <OltPagination page={page} totalPages={totalPages} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}