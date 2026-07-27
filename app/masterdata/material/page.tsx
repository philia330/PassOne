import { Box } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { MaterialDialog } from "@/app/masterdata/material/components/MaterialDialog";
import { MaterialTable } from "@/app/masterdata/material/components/MaterialTable";

export default async function MaterialPage() {
  const rawMaterial = await prisma.material.findMany({ orderBy: { createdAt: "desc" } });

  const material = rawMaterial.map((item) => ({
    ...item,
    harga: Number(item.harga),
  }));

  // Preview doang di form Tambah — kode asli ditentukan renumberKodeMaterial()
  // di actions.ts setelah data benar-benar disimpan.
  const kodeOtomatis = `MTR${String(material.length + 1).padStart(3, "0")}`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased relative overflow-hidden">
      {/* Dekorasi blur gradient background — sama seperti halaman Paket */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-24 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-fuchsia-200/30 blur-3xl" />

      <div className="relative p-6 space-y-6 max-w-7xl mx-auto">

        {/* Header */}
        <Card className="flex-row relative overflow-hidden rounded-3xl shadow-xl border bg-white p-6 flex items-center justify-between">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500" />

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-200">
              <Box className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Data Material</h1>
              <p className="text-sm text-slate-500 font-medium">
                Kelola seluruh data material & inventaris PASSNET
              </p>
            </div>
          </div>

          <MaterialDialog mode="create" kodeOtomatis={kodeOtomatis} />
        </Card>

        <MaterialTable data={material} />

        <p className="text-center text-xs text-slate-400 pt-2">
          © 2025 PASSNET • Sistem Manajemen Material
        </p>
      </div>
    </div>
  );
}