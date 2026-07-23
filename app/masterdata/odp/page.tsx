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

import { getOdps, getOlts } from "./actions";

import { OdpFormDialog } from "./components/OdpFormDialog";
import { DeleteOdpDialog } from "./components/DeleteOdpDialog";
import { OdpMapDialog } from "./components/OdpMapDialog";
import { OdpSearch } from "./components/OdpSearch";
import { OdpPagination } from "./components/OdpPagination";

export default async function OdpPage({
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

  const [{ data: odps, total, totalPages }, olts] = await Promise.all([
    getOdps(search, page),
    getOlts(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Data ODP"
        description="Kelola perangkat Optical Distribution Point (ODP)"
      />

      {/* Statistik */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">
                Total ODP
              </p>

              <h2 className="mt-2 text-5xl font-bold">
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

      {/* Table */}
      <Card className="rounded-3xl border shadow-xl transition-all hover:shadow-2xl">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <OdpSearch defaultValue={search} />

            <OdpFormDialog
              mode="create"
              olts={olts}
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Kode ODP</TableHead>
                  <TableHead>Nama ODP</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>OLT</TableHead>
                  <TableHead>Latitude</TableHead>
                  <TableHead>Longitude</TableHead>
                  <TableHead className="text-right">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {odps.map((odp) => (
                  <TableRow
                    key={odp.id_odp}
                    className="hover:bg-slate-50"
                  >
                    <TableCell className="font-medium">
                      {odp.kode_odp}
                    </TableCell>

                    <TableCell>
                      {odp.nama_odp}
                    </TableCell>

                    <TableCell>
                      {odp.alamat}
                    </TableCell>

                    <TableCell>
                      {odp.olt?.nama_olt}
                    </TableCell>

                    <TableCell>
                      {odp.latitude.toString()}
                    </TableCell>

                    <TableCell>
                      {odp.longitude.toString()}
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
                          }}
                        />

                        <DeleteOdpDialog
                          id={odp.id_odp}
                          name={odp.nama_odp}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {odps.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-slate-400"
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

          <div className="flex justify-end">
            <OdpPagination
              page={page}
              totalPages={totalPages}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}