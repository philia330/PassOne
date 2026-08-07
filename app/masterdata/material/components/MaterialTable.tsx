import { Inbox, Layers, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MaterialDialog } from "@/app/masterdata/material/components/MaterialDialog";
import { MaterialDeleteDialog } from "@/app/masterdata/material/components/MaterialDeleteDialog";
import { MaterialSearch } from "@/app/masterdata/material/components/MaterialSearch";
import { MaterialPagination } from "@/app/masterdata/material/components/MaterialPagination";
import type { MaterialData } from "@/types/material";

interface MaterialTableProps {
  data: MaterialData[];
  search: string;
  page: number;
  total: number;
  totalPages: number;
}

const PAGE_SIZE = 5;

export const MaterialTable = ({
  data,
  search,
  page,
  total,
  totalPages,
}: MaterialTableProps) => {
  return (
    <div className="space-y-6">
      {/* Search bar + Total Material */}
      <Card className="flex-row rounded-3xl shadow-xl border bg-white p-4 flex items-center justify-between gap-4 flex-wrap dark:border-slate-800 dark:bg-slate-900">
        <MaterialSearch defaultValue={search} />

        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 px-4 py-2.5 text-white shadow-md shadow-purple-200 flex-shrink-0 dark:shadow-purple-950/40">
          <Layers size={18} className="text-white/90" />
          <div className="leading-tight">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
              Total Material
            </p>
            <p className="text-lg font-extrabold">{total}</p>
          </div>
        </div>
      </Card>

      {/* DESKTOP: Table */}
      <div className="hidden md:block">
        <Card className="rounded-3xl shadow-xl border bg-white overflow-hidden hover:shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/50">
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">No</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Kode</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Nama Material</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Stok</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Satuan</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Harga</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Kondisi</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Keterangan</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16 text-slate-400 dark:text-slate-500">
                      <Inbox className="mx-auto mb-3" size={40} />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Belum ada data material</p>
                      <p className="text-sm">
                        {search
                          ? "Tidak ada material yang cocok dengan pencarian."
                          : "Silakan tambahkan material baru terlebih dahulu."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, index) => {
                    const menipis = item.stok < item.minimal_stok;
                    return (
                      <TableRow key={item.id_material} className="hover:bg-purple-50/40 transition-colors dark:hover:bg-purple-500/10">
                        <TableCell className="text-center text-slate-400 font-medium dark:text-slate-500">
                          {(page - 1) * PAGE_SIZE + index + 1}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-mono rounded-lg border-purple-200 bg-purple-50 text-purple-700 font-semibold dark:border-purple-800 dark:bg-purple-500/10 dark:text-purple-400"
                          >
                            {item.kode_material}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{item.nama_material}</TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              menipis ? "text-red-600" : "text-slate-900 dark:text-slate-100"
                            }`}
                          >
                            {menipis && <AlertTriangle size={13} />}
                            {item.stok}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600 font-medium dark:text-slate-400">{item.satuan}</TableCell>
                        <TableCell className="font-bold text-slate-900 whitespace-nowrap dark:text-slate-100">
                          Rp {item.harga.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              item.kondisi === "BAIK"
                                ? "bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-100 dark:bg-green-500/20 dark:text-green-400"
                                : "bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-100 dark:bg-red-500/20 dark:text-red-400"
                            }
                          >
                            {item.kondisi === "BAIK" ? "Baik" : "Rusak"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm max-w-[180px] dark:text-slate-400">
                          <span className="block truncate" title={item.keterangan ?? undefined}>
                            {item.keterangan || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <MaterialDialog mode="edit" material={item} />
                            <MaterialDeleteDialog id={item.id_material} namaMaterial={item.nama_material} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* MOBILE: Card list */}
      <div className="space-y-3 md:hidden">
        {data.length === 0 ? (
          <Card className="rounded-3xl shadow-xl border bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
            <Inbox className="mx-auto mb-3" size={40} />
            <p className="font-semibold text-slate-700 dark:text-slate-300">Belum ada data material</p>
            <p className="text-sm">
              {search
                ? "Tidak ada material yang cocok dengan pencarian."
                : "Silakan tambahkan material baru terlebih dahulu."}
            </p>
          </Card>
        ) : (
          data.map((item, index) => {
            const menipis = item.stok < item.minimal_stok;
            return (
              <Card
                key={item.id_material}
                className="rounded-3xl shadow-xl border bg-white p-4 hover:shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className="font-mono rounded-lg border-purple-200 bg-purple-50 text-purple-700 font-semibold text-xs dark:border-purple-800 dark:bg-purple-500/10 dark:text-purple-400"
                      >
                        {item.kode_material}
                      </Badge>
                      <Badge
                        className={
                          item.kondisi === "BAIK"
                            ? "bg-green-100 text-green-700 rounded-lg font-semibold text-xs hover:bg-green-100 dark:bg-green-500/20 dark:text-green-400"
                            : "bg-red-100 text-red-700 rounded-lg font-semibold text-xs hover:bg-red-100 dark:bg-red-500/20 dark:text-red-400"
                        }
                      >
                        {item.kondisi === "BAIK" ? "Baik" : "Rusak"}
                      </Badge>
                    </div>

                    <p className="font-semibold text-slate-900 text-sm truncate dark:text-slate-100">
                      {item.nama_material}
                    </p>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2 text-xs">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500">Stok:</span>
                        <span className={`ml-1 font-bold ${menipis ? "text-red-600" : "text-slate-700 dark:text-slate-300"}`}>
                          {menipis && <AlertTriangle size={11} className="inline mr-0.5" />}
                          {item.stok} {item.satuan}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500">Harga:</span>
                        <span className="ml-1 font-bold text-slate-700 dark:text-slate-300">
                          Rp {item.harga.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    {item.keterangan && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2 dark:text-slate-400">
                        {item.keterangan}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <MaterialDialog mode="edit" material={item} />
                    <MaterialDeleteDialog id={item.id_material} namaMaterial={item.nama_material} />
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <div className="flex justify-end">
        <MaterialPagination page={page} totalPages={totalPages} />
      </div>
    </div>
  );
};