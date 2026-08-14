import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";
import { getPakets, getPaketTotal } from "./actions";
import { PaketSortableTable } from "./components/PaketSortableTable";
import { requirePageAccess } from "@/lib/auth/guards";
import { ExportButton } from "@/components/ui/ExportButton";

export default async function PaketPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}) {
  const session = await requirePageAccess(["ADMIN", "LOGISTIK"]);

  const params = (await searchParams) ?? {};
  const search = params.search ?? "";
  const page = Number(params.page ?? 1);

  const currentRole = session.user.role;
  // Hanya Admin yang bisa delete paket
  const canDelete = currentRole === "ADMIN";

  // Hanya Admin dan Leader yang bisa export
  const canExport = currentRole === "ADMIN" || currentRole === "LEADER";

  const [{ data: paket, total, totalPages }, totalAll] = await Promise.all([
    getPakets(search, page),
    getPaketTotal(),
  ]);

  const kodeOtomatis = `PKT${String(totalAll + 1).padStart(3, "0")}`;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data Paket Internet"
        description="Kelola seluruh data paket internet PASSNET"
      />

      {/* Statistik */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total Paket</p>
              <h2 className="mt-2 text-5xl font-bold">{total}</h2>
              <p className="mt-1 text-sm text-white/80">Paket Terdaftar</p>
            </div>

            <div className="rounded-2xl bg-white/20 p-4">
              <Package className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <PaketSortableTable
        initialData={paket}
        kodeOtomatis={kodeOtomatis}
        defaultValue={search}
        canDelete={canDelete}
        actions={canExport ? <ExportButton apiUrl="/api/paket/export" filenamePrefix="Export_Paket" /> : null}
      />
    </div>
  );
}