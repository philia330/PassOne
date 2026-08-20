import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Router, Wifi, FileText } from "lucide-react";
import { getOdps, getOlts } from "./actions";
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
  }>;
}) {
  const session = await requirePageAccess(["ADMIN", "LEADER"]);

  const params = (await searchParams) ?? {};

  const search = params.search ?? "";
  const page = Number(params.page ?? 1);
  const sortOrder: "asc" | "desc" = params.sort === "desc" ? "desc" : "asc";

  const currentRole = session.user.role as string;

  const currentUser = {
    id_user: Number(session.user.id_user),
    nama: session.user.nama,
    role: currentRole,
  };

  // Hanya Admin dan Leader yang bisa export
  const canExport = currentRole === "ADMIN" || currentRole === "LEADER";

  const [{ data: rawOdps, total, totalPages }, olts] = await Promise.all([
    getOdps(search, page, true, sortOrder),
    getOlts(),
  ]);

  // Convert Decimal to number for sortable table
  const odps = rawOdps.map((o) => ({
    ...o,
    latitude: Number(o.latitude),
    longitude: Number(o.longitude),
  }));

  const allPoints = odps.map((o) => ({
    id_odp: o.id_odp,
    odpNama: o.nama_odp,
    odpLat: Number(o.latitude),
    odpLng: Number(o.longitude),
    oltNama: o.olt?.nama_olt ?? "-",
    oltLat: Number(o.olt?.latitude ?? 0),
    oltLng: Number(o.olt?.longitude ?? 0),
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
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl lg:text-5xl">{total}</h2>
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
                {odps.reduce((sum, o) => sum + ((o as any)._count?.ont || 0), 0)}
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
                {odps.reduce((sum, o) => sum + ((o as any)._count?.baa || 0), 0)}
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
        olts={olts}
        defaultValue={search}
        currentUser={currentUser}
      />
    </div>
  );
}
