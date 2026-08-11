import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Router } from "lucide-react";
import { getOnts, getPops, getOdps } from "./actions";
import { OntSortableTable } from "./components/OntSortableTable";
import { requirePageAccess } from "@/lib/auth/guards";

export default async function OntPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await requirePageAccess(["ADMIN", "LOGISTIK"]);

  const params = await searchParams;
  const search = params.search ?? "";
  const page = Number(params.page ?? 1);

  // getOnts, getPops, getOdps semuanya sudah di-`select`/`include` seperlunya
  // di actions.ts (tanpa field Decimal), jadi tidak perlu trik sanitize lagi di sini.
  const currentRole = session.user.role as string;
  // Hanya Admin yang bisa delete ONT
  const canDelete = currentRole === "ADMIN";

  const [{ data: onts, total, totalPages }, pops, odps] = await Promise.all([
    getOnts(search, page),
    getPops(),
    getOdps(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data ONT"
        description="Kelola perangkat Optical Network Terminal (ONT) pelanggan"
      />

      {/* Stats Card */}
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

      <OntSortableTable initialData={onts} pops={pops} odps={odps} defaultValue={search} canDelete={canDelete} />
    </div>
  );
}