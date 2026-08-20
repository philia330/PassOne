import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Cable } from "lucide-react";
import { getPortPons, getOlts, getOdps } from "./actions";
import { PortPonSortableTable } from "./components/PortPonSortableTable";
import { requirePageAccess } from "@/lib/auth/guards";
import { ExportButton } from "@/components/ui/ExportButton";

export default async function PortPonPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await requirePageAccess(["ADMIN", "TEKNISI"]);

  const params = await searchParams;
  const search = params.search ?? "";
  const page = Number(params.page ?? 1);

  const [{ data: ports, total, totalPages }, olts, odps] = await Promise.all([
    getPortPons(search, page),
    getOlts(),
    getOdps(),
  ]);

  const currentRole = session.user.role as string;
  // Hanya Admin dan Leader yang bisa export
  const canExport = currentRole === "ADMIN" || currentRole === "LEADER";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Data Port PON"
        description="Kelola port PON tiap OLT dan koneksinya ke ODP"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white shadow-lg">
          <CardContent className="flex items-center justify-between p-5 sm:p-6">
            <div>
              <p className="text-sm text-white/80">Total Port PON</p>
              <h2 className="mt-2 text-4xl font-bold sm:text-5xl">{total}</h2>
              <p className="mt-1 text-sm text-white/80">Port Terdaftar</p>
            </div>
            <div className="rounded-2xl bg-white/20 p-4">
              <Cable className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <PortPonSortableTable
        initialData={ports}
        olts={olts}
        odps={odps}
        defaultValue={search}
        actions={canExport ? <ExportButton apiUrl="/api/portpon/export" filenamePrefix="Export_Port_PON" /> : null}
        currentUser={{ id_user: session.user.id_user, nama: session.user.nama ?? "", role: session.user.role }}
      />
    </div>
  );
}