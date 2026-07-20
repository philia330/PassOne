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

import { getPops, getAreas } from "./actions";

import { PopFormDialog } from "./components/PopFormDialog";
import { DeletePopDialog } from "./components/DeletePopDialog";
import { PopSearch } from "./components/PopSearch";
import { PopPagination } from "./components/PopPagination";

export default async function PopPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const page = Number(params.page ?? 1);

  const [{ data: pops, total, totalPages }, areas] = await Promise.all([
    getPops(search, page),
    getAreas(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
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

      <Card className="rounded-3xl border shadow-xl transition-all hover:shadow-2xl">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <PopSearch defaultValue={search} />
            <PopFormDialog mode="create" areas={areas} />
          </div>

          <div className="overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Kode POP</TableHead>
                  <TableHead>Nama POP</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Latitude</TableHead>
                  <TableHead>Longitude</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pops.map((pop) => (
                  <TableRow key={pop.id_pop} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      {pop.kode_pop}
                    </TableCell>
                    <TableCell>{pop.nama_pop}</TableCell>
                    <TableCell>{pop.alamat}</TableCell>
                    <TableCell>{pop.area?.nama_area}</TableCell>
                    <TableCell>{pop.latitude.toString()}</TableCell>
                    <TableCell>{pop.longitude.toString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
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
                        <DeletePopDialog id={pop.id_pop} name={pop.nama_pop} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {pops.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-slate-400"
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

          <div className="flex justify-end">
            <PopPagination page={page} totalPages={totalPages} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}