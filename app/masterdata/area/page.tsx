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
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Data Area"
        description="Kelola wilayah cakupan layanan ISP"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
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

      <Card className="rounded-3xl border shadow-xl transition-all hover:shadow-2xl">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <AreaSearch defaultValue={search} />
            <AreaFormDialog mode="create" />
          </div>

          <div className="overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Kode Area</TableHead>
                  <TableHead>Nama Area</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {areas.map((area) => (
                  <TableRow key={area.id_area} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      {area.kode_area}
                    </TableCell>
                    <TableCell>{area.nama_area}</TableCell>
                    <TableCell>{area.keterangan ?? "-"}</TableCell>
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
                      className="py-10 text-center text-slate-400"
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

          <div className="flex justify-end">
            <AreaPagination page={page} totalPages={totalPages} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}