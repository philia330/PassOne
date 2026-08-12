import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseExcelFile, requireAdmin, normalizeString, isDuplicate } from "@/app/api/_lib/import-utils";

async function generateKodeArea() {
  const latest = await prisma.area.findFirst({
    orderBy: { id_area: "desc" },
    select: { kode_area: true },
  });

  if (!latest) return "AREA-001";

  const match = latest.kode_area.match(/(\d+)$/);
  const next = match ? Number(match[1]) + 1 : 1;
  return `AREA-${String(next).padStart(3, "0")}`;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  return NextResponse.json({ success: true, message: "API Import Area aktif" });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "File Excel tidak ditemukan" }, { status: 400 });
    }

    const rows = await parseExcelFile(file);

    const data = await Promise.all(
      rows.map(async (row, index) => {
        const nama_area = normalizeString(row.nama_area ?? row.nama ?? row.nama_area_name);
        if (!nama_area) {
          throw new Error(`nama_area kosong pada baris ${index + 2}`);
        }

        const kode_area = normalizeString(row.kode_area ?? row.kode ?? row.kode_area_name) || (await generateKodeArea());
        const keterangan = normalizeString(row.keterangan ?? row.catatan ?? row.deskripsi);

        return {
          kode_area,
          nama_area,
          keterangan,
        };
      })
    );

    const duplicateKode = isDuplicate(data.map((item) => item.kode_area));
    const duplicateNama = isDuplicate(data.map((item) => item.nama_area));

    if (duplicateKode.length > 0 || duplicateNama.length > 0) {
      return NextResponse.json(
        { success: false, message: "Kode Area atau Nama Area duplikat di Excel", duplicateKode, duplicateNama },
        { status: 400 }
      );
    }

    for (const item of data) {
      const exists = await prisma.area.findFirst({
        where: {
          OR: [{ kode_area: item.kode_area }, { nama_area: item.nama_area }],
        },
      });

      if (exists) {
        throw new Error(`Area dengan kode/nama "${item.kode_area}" atau "${item.nama_area}" sudah ada`);
      }
    }

    const result = await prisma.area.createMany({ data });

    return NextResponse.json({ success: true, message: "Import Area berhasil", totalImport: result.count });
  } catch (error: any) {
    console.error("IMPORT AREA ERROR:", error);
    return NextResponse.json({ success: false, message: error.message || "Import Area gagal" }, { status: 500 });
  }
}
