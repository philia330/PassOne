import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Router, MapPin as MapPinIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getPops, getAreas } from "./actions";

import { PopFormDialog } from "./components/PopFormDialog";
import { DeletePopDialog } from "./components/DeletePopDialog";
import { PopSearch } from "./components/PopSearch";
import { PopPagination } from "./components/PopPagination";
import { PopMapDialog } from "./components/PopMapDialog";
import { requirePageAccess } from "@/lib/auth/guards";

export default async function PopPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await requirePageAccess(["ADMIN"]);

  const params = await searchParams;
  const search = params.search ?? "";
  const page = Number(params.page ?? 1);

  const [{ data: pops, total, totalPages }, areas] = await Promise.all([
    getPops(search, page),
    getAreas(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data POP"
        description="Kelola Point of Presence (POP) di setiap area"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total POP</p>
              <h2 className="mt-2 text-4xl font-bold">{total}</h2>
              <p className="mt-1 text-sm text-white/80">Perangkat Terdaftar</p>
            </div>

            <div className="rounded-2xl bg-white/20 p-4">
              <Router className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border border-slate-200 bg-white shadow-xl transition-all hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <CardContent className="space-y-6 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <PopSearch defaultValue={search} />
            <PopFormDialog mode="create" areas={areas} />
          </div>

          {/* ====================================================== */}
          {/* Versi Tabel - hanya muncul di layar medium ke atas (md:) */}
          {/* ====================================================== */}
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/30">
                  <TableHead>Kode POP</TableHead>
                  <TableHead>Nama POP</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Latitude</TableHead>
                  <TableHead>Longitude</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pops.map((pop) => (
                  <TableRow
                    key={pop.id_pop}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/70"
                  >
                    <TableCell className="font-medium dark:text-slate-200">
                      {pop.kode_pop}
                    </TableCell>
                    <TableCell className="dark:text-slate-300">{pop.nama_pop}</TableCell>
                    <TableCell className="dark:text-slate-300">{pop.alamat}</TableCell>
                    <TableCell className="dark:text-slate-300">{pop.area?.nama_area}</TableCell>
                    <TableCell className="dark:text-slate-300">{pop.latitude.toString()}</TableCell>
                    <TableCell className="dark:text-slate-300">{pop.longitude.toString()}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">
                      {new Date(pop.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <PopMapDialog
                          nama={pop.nama_pop}
                          lat={Number(pop.latitude)}
                          lng={Number(pop.longitude)}
                        />

                        <PopFormDialog
                          mode="edit"
                          areas={areas}
                          data={{
                            id_pop: pop.id_pop,
                            nama_pop: pop.nama_pop,
                            alamat: pop.alamat,
                            latitude: pop.latitude.toString(),
                            longitude: pop.longitude.toString(),
                            id_area: pop.id_area,
                          }}
                        />

                        <DeletePopDialog
                          id={pop.id_pop}
                          name={pop.nama_pop}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {pops.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-slate-400 dark:text-slate-500"
                    >
                      {search
                        ? "Tidak ada data POP yang cocok dengan pencarian"
                        : "Belum ada data POP"}
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
            {pops.map((pop) => (
              <div
                key={pop.id_pop}
                className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      {pop.nama_pop}
                    </p>

                    <p className="text-sm text-slate-500 dark:text-slate-500">
                      {pop.kode_pop}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <PopMapDialog
                      nama={pop.nama_pop}
                      lat={Number(pop.latitude)}
                      lng={Number(pop.longitude)}
                    />

                    <PopFormDialog
                      mode="edit"
                      areas={areas}
                      data={{
                        id_pop: pop.id_pop,
                        nama_pop: pop.nama_pop,
                        alamat: pop.alamat,
                        latitude: pop.latitude.toString(),
                        longitude: pop.longitude.toString(),
                        id_area: pop.id_area,
                      }}
                    />

                    <DeletePopDialog
                      id={pop.id_pop}
                      name={pop.nama_pop}
                    />
                  </div>
                </div>

                <p className="flex items-start gap-1 text-sm text-slate-600 dark:text-slate-300">
                  <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                  {pop.alamat}
                </p>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Area: {pop.area?.nama_area}
                </p>

                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {pop.latitude.toString()}, {pop.longitude.toString()}
                </p>

                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Dibuat:{" "}
                  {new Date(pop.createdAt).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}

            {pops.length === 0 && (
              <div className="rounded-2xl border border-slate-200 py-10 text-center text-slate-400 dark:border-slate-800 dark:text-slate-500">
                {search
                  ? "Tidak ada data POP yang cocok dengan pencarian"
                  : "Belum ada data POP"}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <PopPagination page={page} totalPages={totalPages} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}