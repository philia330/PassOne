import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Router } from "lucide-react";

import { getPops, getAreas } from "./actions";

import { PopSortableTable } from "./components/PopSortableTable";
import { requirePageAccess } from "@/lib/auth/guards";

export default async function PopPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await requirePageAccess(["ADMIN"]);

  const params = await searchParams;
  const search = params.search ?? "";
  const page = Number(params.page ?? 1);

  const [{ data: pops, total, totalPages }, areas] = await Promise.all([
    getPops(search, page),
    getAreas(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data POP"
        description="Kelola Point of Presence (POP) di setiap area"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-white/80">Total POP</p>
              <h2 className="mt-2 text-4xl font-bold">{total}</h2>
              <p className="mt-1 text-sm text-white/80">Perangkat Terdaftar</p>
            </div>

            <div className="rounded-2xl bg-white/20 p-4">
              <Router className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <PopSortableTable initialData={pops} areas={areas} defaultValue={search} />
    </div>
  );
}