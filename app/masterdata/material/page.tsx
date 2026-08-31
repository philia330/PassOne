import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Box } from "lucide-react";
import { getMaterials, getMaterialTotal } from "./actions";
import { MaterialSortableTable } from "./components/MaterialSortableTable";
import { requirePageAccess } from "@/lib/auth/guards";
import { ExportButton } from "@/components/ui/ExportButton";

export default async function MaterialPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
    highlight?: string;
  }>;
}) {
  const session = await requirePageAccess(["ADMIN", "LOGISTIK", "TEKNISI"]);

  const params = (await searchParams) ?? {};
  const search = params.search ?? "";
  const page = Number(params.page ?? 1);
  const highlightId = params?.highlight ? Number(params.highlight) : null;

  const currentRole = session.user.role;
  // Hanya Admin yang bisa delete material
  const canDelete = currentRole === "ADMIN";

  const currentUser = {
    id_user: Number(session.user.id_user),
    nama: session.user.nama,
    role: currentRole,
  };

  // Hanya Admin dan Leader yang bisa export
  const canExport = currentRole === "ADMIN" || currentRole === "LEADER";

  const [{ data: material, total, totalPages }, totalAll] = await Promise.all([
    getMaterials(search, page),
    getMaterialTotal(),
  ]);

  const kodeOtomatis = `MTR${String(totalAll + 1).padStart(3, "0")}`;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data Material"
        description="Kelola seluruh data material & inventaris PASSNET"
      />

      {/* Statistik */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total Material</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl lg:text-5xl">{totalAll}</h2>
              <p className="mt-1 text-sm text-white/80">Material Terdaftar</p>
            </div>

            <div className="rounded-2xl bg-white/20 p-4">
              <Box className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <MaterialSortableTable
        initialData={material}
        kodeOtomatis={kodeOtomatis}
        defaultValue={search}
        currentUser={currentUser}
        actions={canExport ? <ExportButton apiUrl="/api/material/export" filenamePrefix="Export_Material" /> : null}
      />
    </div>
  );
}