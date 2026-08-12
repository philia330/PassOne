import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseExcelFile, requireAdmin, normalizeString, isDuplicate, toNumber } from "@/app/api/_lib/import-utils";

async function generateKodeMaterial() {
  const latest = await prisma.material.findFirst({
    orderBy: { id_material: "desc" },
    select: { kode_material: true },
  });

  if (!latest) return "MTR-001";

  const match = latest.kode_material.match(/(\d+)$/);
  const next = match ? Number(match[1]) + 1 : 1;
  return `MTR-${String(next).padStart(3, "0")}`;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  return NextResponse.json({ success: true, message: "API Import Material aktif" });
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
        const nama_material = normalizeString(row.nama_material ?? row.nama ?? row.material);
        const satuan = normalizeString(row.satuan ?? row.unit);
        const hargaValue = toNumber(row.harga ?? row.harga_satuan ?? row.price);

        if (!nama_material) throw new Error(`nama_material kosong pada baris ${index + 2}`);
        if (!satuan) throw new Error(`satuan kosong pada baris ${index + 2}`);
        if (hargaValue === null || hargaValue <= 0) throw new Error(`harga tidak valid pada baris ${index + 2}`);

        const kode_material = normalizeString(row.kode_material ?? row.kode ?? row.kode_material_name) || (await generateKodeMaterial());
        const stok = toNumber(row.stok) ?? 0;
        const minimal_stok = toNumber(row.minimal_stok ?? row.stok_minimal) ?? 5;
        const kondisi = normalizeString(row.kondisi ?? row.status_material) || "BAIK";
        const keterangan = normalizeString(row.keterangan ?? row.catatan ?? row.deskripsi);

        return {
          kode_material,
          nama_material,
          stok,
          minimal_stok,
          satuan,
          harga: new Prisma.Decimal(hargaValue),
          kondisi: kondisi === "RUSAK" ? "RUSAK" : "BAIK",
          keterangan,
        };
      })
    );

    const duplicateKode = isDuplicate(data.map((item) => item.kode_material));
    const duplicateNama = isDuplicate(data.map((item) => item.nama_material));

    if (duplicateKode.length > 0 || duplicateNama.length > 0) {
      return NextResponse.json(
        { success: false, message: "Kode Material atau Nama Material duplikat di Excel", duplicateKode, duplicateNama },
        { status: 400 }
      );
    }

    for (const item of data) {
      const exists = await prisma.material.findFirst({
        where: {
          OR: [{ kode_material: item.kode_material }, { nama_material: item.nama_material }],
        },
      });

      if (exists) {
        throw new Error(`Material dengan kode/nama "${item.kode_material}" atau "${item.nama_material}" sudah ada`);
      }
    }

    const result = await prisma.material.createMany({ data: data as any });

    return NextResponse.json({ success: true, message: "Import Material berhasil", totalImport: result.count });
  } catch (error: any) {
    console.error("IMPORT MATERIAL ERROR:", error);
    return NextResponse.json({ success: false, message: error.message || "Import Material gagal" }, { status: 500 });
  }
}
