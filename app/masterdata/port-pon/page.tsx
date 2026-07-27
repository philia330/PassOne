import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Cable } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getPortPons, getOlts, getOdps } from "./actions";

import { PortPonFormDialog } from "./components/PortPonFormDialog";
import { DeletePortPonDialog } from "./components/DeletePortPonDialog";
import { PortPonSearch } from "./components/PortPonSearch";
import { PortPonPagination } from "./components/PortPonPagination";

const statusBadge: Record<string, string> = {
  TERSEDIA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  TERPASANG: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
  RUSAK: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
};

export default async function PortPonPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const page = Number(params.page ?? 1);

  const [{ data: ports, total, totalPages }, olts, odps] = await Promise.all([
    getPortPons(search, page),
    getOlts(),
    getOdps(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Data Port PON"
        description="Kelola port PON tiap OLT dan koneksinya ke ODP"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total Port PON</p>
              <h2 className="mt-2 text-4xl font-bold">{total}</h2>
              <p className="mt-1 text-sm text-white/80">Port Terdaftar</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-4">
              <Cable className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border shadow-xl transition-all hover:shadow-2xl dark:border-slate-800">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <PortPonSearch defaultValue={search} />
            <PortPonFormDialog mode="create" olts={olts} odps={odps} />
          </div>

          <div className="overflow-x-auto rounded-2xl border dark:border-slate-800">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900">
                  <TableHead>OLT</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ODP Terhubung</TableHead>
                  <TableHead>Nomor Port</TableHead>
                  <TableHead>Tipe Kartu</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {ports.map((port) => (
                  <TableRow
                    key={port.id_port}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    {/* 1. OLT */}
                    <TableCell className="font-medium">
                      {port.olt?.nama_olt}
                    </TableCell>

                    {/* 2. Status */}
                    <TableCell>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          statusBadge[port.status] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {port.status}
                      </span>
                    </TableCell>

                    {/* 3. ODP Terhubung */}
                    <TableCell>{port.odp?.nama_odp ?? "-"}</TableCell>

                    {/* 4. Nomor Port */}
                    <TableCell>{port.nomor_port}</TableCell>

                    {/* 5. Tipe Kartu */}
                    <TableCell>{port.tipe_kartu}</TableCell>

                    {/* 6. Aksi (Paling Kanan) */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <PortPonFormDialog
                          mode="edit"
                          olts={olts}
                          odps={odps}
                          data={{
                            id_port_pon: port.id_port,
                            nomor_port: port.nomor_port,
                            tipe_kartu: port.tipe_kartu,
                            status: port.status,
                            id_olt: port.id_olt,
                            id_odp: port.id_odp,
                          }}
                        />
                        <DeletePortPonDialog
                          id={port.id_port}
                          name={`${port.olt?.nama_olt} - Port ${port.nomor_port}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {ports.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-slate-400"
                    >
                      {search
                        ? "Tidak ada data Port PON yang cocok dengan pencarian"
                        : "Belum ada data Port PON"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <PortPonPagination page={page} totalPages={totalPages} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}