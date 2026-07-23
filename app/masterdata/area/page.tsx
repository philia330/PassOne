import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getAreas } from "./actions";

import { AreaFormDialog } from "./components/AreaFormDialog";
import { DeleteAreaDialog } from "./components/DeleteAreaDialog";
import { AreaSearch } from "./components/AreaSearch";
import { AreaPagination } from "./components/AreaPagination";

export default async function AreaPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const page = Number(params.page ?? 1);

  const { data: areas, total, totalPages } = await getAreas(search, page);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data Area"
        description="Kelola wilayah cakupan layanan ISP"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg dark:shadow-none">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total Area</p>
              <h2 className="mt-2 text-4xl font-bold">{total}</h2>
              <p className="mt-1 text-sm text-white/80">Wilayah Terdaftar</p>
            </div>

            <div className="rounded-2xl bg-white/20 p-4">
              <MapPin className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border shadow-xl transition-all hover:shadow-2xl dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">
        <CardContent className="space-y-6 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <AreaSearch defaultValue={search} />
            <AreaFormDialog mode="create" />
          </div>

          {/* ====================================================== */}
          {/* Versi Tabel - hanya muncul di layar medium ke atas (md:) */}
          {/* ====================================================== */}
          <div className="hidden overflow-x-auto rounded-2xl border md:block dark:border-slate-800">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/30">
                  <TableHead className="dark:text-slate-300">Kode Area</TableHead>
                  <TableHead className="dark:text-slate-300">Nama Area</TableHead>
                  <TableHead className="dark:text-slate-300">Keterangan</TableHead>
                  <TableHead className="text-right dark:text-slate-300">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {areas.map((area) => (
                  <TableRow
                    key={area.id_area}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-800"
                  >
                    <TableCell className="font-medium dark:text-slate-100">
                      {area.kode_area}
                    </TableCell>
                    <TableCell className="dark:text-slate-300">
                      {area.nama_area}
                    </TableCell>
                    <TableCell className="dark:text-slate-300">
                      {area.keterangan ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <AreaFormDialog
                          mode="edit"
                          data={{
                            id_area: area.id_area,
                            nama_area: area.nama_area,
                            keterangan: area.keterangan,
                          }}
                        />
                        <DeleteAreaDialog
                          id={area.id_area}
                          name={area.nama_area}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {areas.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-10 text-center text-slate-400 dark:text-slate-500"
                    >
                      {search
                        ? "Tidak ada data Area yang cocok dengan pencarian"
                        : "Belum ada data Area"}
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
            {areas.map((area) => (
              <div
                key={area.id_area}
                className="space-y-2 rounded-2xl border p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold dark:text-slate-100">{area.nama_area}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">{area.kode_area}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <AreaFormDialog
                      mode="edit"
                      data={{
                        id_area: area.id_area,
                        nama_area: area.nama_area,
                        keterangan: area.keterangan,
                      }}
                    />
                    <DeleteAreaDialog
                      id={area.id_area}
                      name={area.nama_area}
                    />
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {area.keterangan ?? "-"}
                </p>
              </div>
            ))}

            {areas.length === 0 && (
              <div className="rounded-2xl border py-10 text-center text-slate-400 dark:border-slate-800 dark:text-slate-500">
                {search
                  ? "Tidak ada data Area yang cocok dengan pencarian"
                  : "Belum ada data Area"}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <AreaPagination page={page} totalPages={totalPages} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}