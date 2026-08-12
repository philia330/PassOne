import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseExcelFile, requireAdmin, normalizeString, isDuplicate, toNumber } from "@/app/api/_lib/import-utils";

async function generateKodePop() {
  const latest = await prisma.pop.findFirst({
    orderBy: { id_pop: "desc" },
    select: { kode_pop: true },
  });

  if (!latest) return "POP-001";

  const match = latest.kode_pop.match(/(\d+)$/);
  const next = match ? Number(match[1]) + 1 : 1;
  return `POP-${String(next).padStart(3, "0")}`;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  return NextResponse.json({ success: true, message: "API Import POP aktif" });
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
        const nama_pop = normalizeString(row.nama_pop ?? row.nama ?? row.pop_name);
        const alamat = normalizeString(row.alamat ?? row.address ?? row.lokasi);
        const latitude = toNumber(row.latitude ?? row.lat);
        const longitude = toNumber(row.longitude ?? row.lng ?? row.lon);

        if (!nama_pop) throw new Error(`nama_pop kosong pada baris ${index + 2}`);
        if (!alamat) throw new Error(`alamat kosong pada baris ${index + 2}`);
        if (latitude === null || longitude === null) throw new Error(`latitude/longitude tidak valid pada baris ${index + 2}`);

        const areaValue = row.id_area ?? row.area_id ?? row.kode_area ?? row.area;
        let id_area: number | null = null;

        if (areaValue !== null && areaValue !== undefined && areaValue !== "") {
          const areaId = toNumber(areaValue);
          if (areaId !== null) {
            id_area = areaId;
          } else {
            const areaCode = normalizeString(areaValue);
            const area = areaCode ? await prisma.area.findUnique({ where: { kode_area: areaCode } }) : null;
            if (!area) throw new Error(`Area dengan kode "${areaCode}" tidak ditemukan pada baris ${index + 2}`);
            id_area = area.id_area;
          }
        }

        if (id_area === null) throw new Error(`id_area / kode_area wajib diisi pada baris ${index + 2}`);

        const kode_pop = normalizeString(row.kode_pop ?? row.kode ?? row.pop_code) || (await generateKodePop());

        return {
          kode_pop,
          nama_pop,
          alamat,
          latitude,
          longitude,
          id_area,
        };
      })
    );

    const duplicateKode = isDuplicate(data.map((item) => item.kode_pop));
    const duplicateNama = isDuplicate(data.map((item) => item.nama_pop));

    if (duplicateKode.length > 0 || duplicateNama.length > 0) {
      return NextResponse.json(
        { success: false, message: "Kode POP atau Nama POP duplikat di Excel", duplicateKode, duplicateNama },
        { status: 400 }
      );
    }

    for (const item of data) {
      const exists = await prisma.pop.findFirst({
        where: {
          OR: [{ kode_pop: item.kode_pop }, { nama_pop: item.nama_pop }],
        },
      });

      if (exists) {
        throw new Error(`POP dengan kode/nama "${item.kode_pop}" atau "${item.nama_pop}" sudah ada`);
      }
    }

    const result = await prisma.pop.createMany({ data });

    return NextResponse.json({ success: true, message: "Import POP berhasil", totalImport: result.count });
  } catch (error: any) {
    console.error("IMPORT POP ERROR:", error);
    return NextResponse.json({ success: false, message: error.message || "Import POP gagal" }, { status: 500 });
  }
}
