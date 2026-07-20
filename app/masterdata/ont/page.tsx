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

import { getOnts, getPops, getOdps } from "./actions";

import { OntFormDialog } from "./components/OntFormDialog";
import { DeleteOntDialog } from "./components/DeleteOntDialog";
import { OntSearch } from "./components/OntSearch";
import { OntPagination } from "./components/OntPagination";

const statusBadge: Record<string, string> = {
  TERSEDIA: "bg-emerald-100 text-emerald-700",
  TERPASANG: "bg-sky-100 text-sky-700",
  RUSAK: "bg-rose-100 text-rose-700",
};

export default async function OntPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const page = Number(params.page ?? 1);

  const [{ data: onts, total, totalPages }, pops, odps] = await Promise.all([
    getOnts(search, page),
    getPops(),
    getOdps(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Data ONT"
        description="Kelola perangkat Optical Network Terminal (ONT) pelanggan"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total ONT</p>
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
            <OntSearch defaultValue={search} />
            <OntFormDialog mode="create" pops={pops} odps={odps} />
          </div>

          <div className="overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>POP</TableHead>
                  <TableHead>ODP</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {onts.map((ont) => (
                  <TableRow key={ont.id_ont} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      {ont.serial_number}
                    </TableCell>
                    <TableCell>{ont.pelanggan}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge[ont.status]}`}
                      >
                        {ont.status}
                      </span>
                    </TableCell>
                    <TableCell>{ont.pop?.nama_pop}</TableCell>
                    <TableCell>{ont.odp?.nama_odp}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <OntFormDialog
                          mode="edit"
                          pops={pops}
                          odps={odps}
                          data={{
                            id_ont: ont.id_ont,
                            serial_number: ont.serial_number,
                            pelanggan: ont.pelanggan,
                            status: ont.status,
                            id_pop: ont.id_pop,
                            id_odp: ont.id_odp,
                          }}
                        />
                        <DeleteOntDialog
                          id={ont.id_ont}
                          name={ont.serial_number}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {onts.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-slate-400"
                    >
                      {search
                        ? "Tidak ada data ONT yang cocok dengan pencarian"
                        : "Belum ada data ONT"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <OntPagination page={page} totalPages={totalPages} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}