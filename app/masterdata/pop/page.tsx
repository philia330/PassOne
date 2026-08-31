import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Router } from "lucide-react";

import { getPops, getAreas } from "./actions";
import { prisma } from "@/lib/prisma";

import { PopSortableTable } from "./components/PopSortableTable";
import { requirePageAccess } from "@/lib/auth/guards";
import { ExportButton } from "@/components/ui/ExportButton";

export default async function PopPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; highlight?: string }>;
}) {
  const session = await requirePageAccess(["ADMIN"]);

  const params = await searchParams;
  const search = params.search ?? "";
  const page = Number(params.page ?? 1);
  const highlightId = params?.highlight ? Number(params.highlight) : null;

  // Hitung total SEMUA data (tanpa filter) untuk card statistik
  const [totalCount, { data: rawPops, total, totalPages }, areas] = await Promise.all([
    prisma.pop.count(),
    getPops(search, page),
    getAreas(),
  ]);

  const currentRole = session.user.role;
  // Hanya Admin yang bisa delete POP
  const canDelete = currentRole === "ADMIN";

  const currentUser = {
    id_user: Number(session.user.id_user),
    nama: session.user.nama,
    role: currentRole,
  };

  const pops = rawPops.map((pop) => ({
    ...pop,
    latitude: Number(pop.latitude),
    longitude: Number(pop.longitude),
  }));

  // Hanya Admin dan Leader yang bisa export
  const canExport = currentRole === "ADMIN" || currentRole === "LEADER";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data POP"
        description="Kelola Point of Presence (POP) di setiap area"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total POP</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl lg:text-5xl">{totalCount}</h2>
              <p className="mt-1 text-sm text-white/80">Perangkat Terdaftar</p>
            </div>

            <div className="rounded-2xl bg-white/20 p-4">
              <Router className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <PopSortableTable
        initialData={pops}
        areas={areas}
        defaultValue={search}
        canDelete={canDelete}
        currentUser={currentUser}
        actions={canExport ? <ExportButton apiUrl="/api/pop/export" filenamePrefix="Export_POP" /> : null}
      />
    </div>
  );
}