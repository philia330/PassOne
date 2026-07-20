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
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Data OLT"
        description="Kelola perangkat Optical Line Terminal (OLT) di setiap POP"
      />

      <div className="grid gap-4 md:grid-cols-3">
  <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
    <CardContent className="flex items-center justify-between p-6">
      <div>
        <p className="text-sm text-white/80">
          Total OLT
        </p>

        <h2 className="mt-2 text-4xl font-bold">
          {total}
        </h2>

        <p className="mt-1 text-sm text-white/80">
          Perangkat Terdaftar
        </p>
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
            <OltSearch defaultValue={search} />
            <OltFormDialog mode="create" pops={pops} />
          </div>

          <div className="overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Kode OLT</TableHead>
                  <TableHead>Nama OLT</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>POP</TableHead>
                  <TableHead>Latitude</TableHead>
                  <TableHead>Longitude</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {olts.map((olt) => (
                  <TableRow key={olt.id_olt} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      {olt.kode_olt}
                    </TableCell>
                    <TableCell>{olt.nama_olt}</TableCell>
                    <TableCell>{olt.lokasi}</TableCell>
                    <TableCell>{olt.pop?.nama_pop}</TableCell>
                    <TableCell>{olt.latitude.toString()}</TableCell>
                    <TableCell>{olt.longitude.toString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
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
                      className="py-10 text-center text-slate-400"
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

          <div className="flex justify-end">
  <OltPagination page={page} totalPages={totalPages} />
</div>
        </CardContent>
      </Card>
    </div>
  );
}
