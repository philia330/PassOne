import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Router } from "lucide-react";
import { getOlts, getPops } from "./actions";
import { prisma } from "@/lib/prisma";
import { OltSortableTable } from "./components/OltSortableTable";
import { requirePageAccess } from "@/lib/auth/guards";
import { ExportButton } from "@/components/ui/ExportButton";

export default async function OltPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
    highlight?: string;
  }>;
}) {
  const session = await requirePageAccess(["ADMIN", "LEADER"]);

  const params = await searchParams;

  const search = params.search ?? "";
  const page = Number(params.page ?? 1);
  const highlightId = params?.highlight ? Number(params.highlight) : null;

  // Hitung total SEMUA data (tanpa filter) untuk card statistik
  const [totalCount, { data: olts, total, totalPages }, pops] = await Promise.all([
    prisma.olt.count(),
    getOlts(search, page),
    getPops(),
  ]);

  const currentRole = session.user.role;

  const currentUser = {
    id_user: Number(session.user.id_user),
    nama: session.user.nama,
    role: currentRole,
  };

  // Hanya Admin dan Leader yang bisa export
  const canExport = currentRole === "ADMIN" || currentRole === "LEADER";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data OLT"
        description="Kelola perangkat Optical Line Terminal (OLT) di setiap POP"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total OLT</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl lg:text-5xl">{totalCount}</h2>
              <p className="mt-1 text-sm text-white/80">Perangkat Terdaftar</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-4">
              <Router className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <OltSortableTable
        initialData={olts}
        pops={pops}
        defaultValue={search}
        currentRole={currentRole}
        currentUser={currentUser}
        actions={canExport ? <ExportButton apiUrl="/api/olt/export" filenamePrefix="Export_OLT" /> : null}
      />
    </div>
  );
}