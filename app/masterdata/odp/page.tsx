import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Router, Wifi, FileText } from "lucide-react";
import { getOdps, getOlts } from "./actions";
import { prisma } from "@/lib/prisma";
import { OdpSortableTable } from "./components/OdpSortableTable";
import { requirePageAccess } from "@/lib/auth/guards";
import { ExportButton } from "@/components/ui/ExportButton";

export default async function OdpPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
    sort?: string;
    highlight?: string;
  }>;
}) {
  const session = await requirePageAccess(["ADMIN", "LEADER"]);

  const params = (await searchParams) ?? {};

  const search = params.search ?? "";
  const page = Number(params.page ?? 1);
  const sortOrder: "asc" | "desc" = params.sort === "desc" ? "desc" : "asc";
  const highlightId = params?.highlight ? Number(params.highlight) : null;

  const currentRole = session.user.role as string;

  const currentUser = {
    id_user: Number(session.user.id_user),
    nama: session.user.nama,
    role: currentRole,
  };

  // Hanya Admin dan Leader yang bisa export
  const canExport = currentRole === "ADMIN" || currentRole === "LEADER";

  // Hitung total SEMUA data (tanpa filter) untuk card statistik
  const [totalOdp, totalOnt, totalBaa, { data: rawOdps, total, totalPages }, olts] = await Promise.all([
    prisma.odp.count(),
    prisma.ont.count(),
    prisma.baa.count(),
    getOdps(search, page, true, sortOrder),
    getOlts(),
  ]);

  // Convert Decimal to number for sortable table (Prisma returns Decimal objects)
  const odps = rawOdps.map((o) => ({
    id_odp: o.id_odp,
    kode_odp: o.kode_odp,
    nama_odp: o.nama_odp,
    alamat: o.alamat,
    latitude: Number(o.latitude),
    longitude: Number(o.longitude),
    id_olt: o.id_olt,
    jumlah_port: o.jumlah_port,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    olt: o.olt ? {
      id_olt: o.olt.id_olt,
      nama_olt: o.olt.nama_olt,
    } : null,
    _count: o._count,
  }));

  // Convert olts to plain objects (remove Prisma Decimal fields)
  const oltsData = olts.map((o) => ({
    id_olt: o.id_olt,
    nama_olt: o.nama_olt,
  }));

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data ODP"
        description="Kelola perangkat Optical Distribution Point (ODP)"
      />

      {/* Statistik */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total ODP</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl lg:text-5xl">{totalOdp}</h2>
              <p className="mt-1 text-sm text-white/80">Perangkat Terdaftar</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-4">
              <Router className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total ONT</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl lg:text-5xl">
                {totalOnt}
              </h2>
              <p className="mt-1 text-sm text-white/80">ONT Terpasang</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-4">
              <Wifi className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total BAA</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl lg:text-5xl">
                {totalBaa}
              </h2>
              <p className="mt-1 text-sm text-white/80">BAA Terbuat</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-4">
              <FileText className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <OdpSortableTable
        initialData={odps}
        olts={oltsData}
        defaultValue={search}
        currentUser={currentUser}
      />
    </div>
  );
}
