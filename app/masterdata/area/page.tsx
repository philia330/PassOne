import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

import { getAreas } from "./actions";

import { AreaSortableTable } from "./components/AreaSortableTable";
import { requirePageAccess } from "@/lib/auth/guards";
import { ExportButton } from "@/components/ui/ExportButton";

export default async function AreaPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await requirePageAccess(["ADMIN"]);

  const params = await searchParams;
  const search = params.search ?? "";
  const page = Number(params.page ?? 1);

  const { data: areas, total, totalPages } = await getAreas(search, page);

  // Hanya Admin dan Leader yang bisa export
  const canExport = session.user.role === "ADMIN" || session.user.role === "LEADER";

  const currentUser = {
    id_user: session.user.id_user,
    nama: session.user.nama,
    role: session.user.role,
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data Area"
        description="Kelola wilayah cakupan layanan ISP"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg dark:shadow-none">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total Area</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl lg:text-5xl">{total}</h2>
              <p className="mt-1 text-sm text-white/80">Wilayah Terdaftar</p>
            </div>

            <div className="rounded-2xl bg-white/20 p-4">
              <MapPin className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <AreaSortableTable
        initialData={areas}
        total={total}
        totalPages={totalPages}
        defaultValue={search}
        currentUser={currentUser}
        actions={canExport ? <ExportButton apiUrl="/api/area/export" filenamePrefix="Export_Area" /> : null}
      />
    </div>
  );
}