import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseExcelFile, requireAdmin, normalizeString, isDuplicate, toNumber } from "@/app/api/_lib/import-utils";

async function generateKodePaket() {
  const latest = await prisma.paket.findFirst({
    orderBy: { id_paket: "desc" },
    select: { kode_paket: true },
  });

  if (!latest) return "PKT-001";

  const match = latest.kode_paket.match(/(\d+)$/);
  const next = match ? Number(match[1]) + 1 : 1;
  return `PKT-${String(next).padStart(3, "0")}`;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  return NextResponse.json({ success: true, message: "API Import Paket aktif" });
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
        const nama_paket = normalizeString(row.nama_paket ?? row.nama ?? row.paket_name);
        const kecepatan = normalizeString(row.kecepatan ?? row.speed ?? row.kapasitas);
        const harga = toNumber(row.harga ?? row.harga_paket ?? row.price);

        if (!nama_paket) throw new Error(`nama_paket kosong pada baris ${index + 2}`);
        if (!kecepatan) throw new Error(`kecepatan kosong pada baris ${index + 2}`);
        if (harga === null || harga <= 0) throw new Error(`harga tidak valid pada baris ${index + 2}`);

        const kode_paket = normalizeString(row.kode_paket ?? row.kode ?? row.paket_code) || (await generateKodePaket());
        const keterangan = normalizeString(row.keterangan ?? row.catatan ?? row.deskripsi);

        return {
          kode_paket,
          nama_paket,
          kecepatan,
          harga: new Prisma.Decimal(harga),
          keterangan,
        };
      })
    );

    const duplicateKode = isDuplicate(data.map((item) => item.kode_paket));
    const duplicateNama = isDuplicate(data.map((item) => item.nama_paket));

    if (duplicateKode.length > 0 || duplicateNama.length > 0) {
      return NextResponse.json(
        { success: false, message: "Kode Paket atau Nama Paket duplikat di Excel", duplicateKode, duplicateNama },
        { status: 400 }
      );
    }

    for (const item of data) {
      const exists = await prisma.paket.findFirst({
        where: {
          OR: [{ kode_paket: item.kode_paket }, { nama_paket: item.nama_paket }],
        },
      });

      if (exists) {
        throw new Error(`Paket dengan kode/nama "${item.kode_paket}" atau "${item.nama_paket}" sudah ada`);
      }
    }

    const result = await prisma.paket.createMany({ data });

    return NextResponse.json({ success: true, message: "Import Paket berhasil", totalImport: result.count });
  } catch (error: any) {
    console.error("IMPORT PAKET ERROR:", error);
    return NextResponse.json({ success: false, message: error.message || "Import Paket gagal" }, { status: 500 });
  }
}
