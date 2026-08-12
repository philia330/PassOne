import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseExcelFile, requireAdmin, normalizeString, isDuplicate, toNumber } from "@/app/api/_lib/import-utils";

async function generateKodeOlt() {
  const latest = await prisma.olt.findFirst({
    orderBy: { id_olt: "desc" },
    select: { kode_olt: true },
  });

  if (!latest) return "OLT-001";

  const match = latest.kode_olt.match(/(\d+)$/);
  const next = match ? Number(match[1]) + 1 : 1;
  return `OLT-${String(next).padStart(3, "0")}`;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  return NextResponse.json({ success: true, message: "API Import OLT aktif" });
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
        const nama_olt = normalizeString(row.nama_olt ?? row.nama ?? row.olt_name);
        const lokasi = normalizeString(row.lokasi ?? row.alamat ?? row.location);
        const latitude = toNumber(row.latitude ?? row.lat);
        const longitude = toNumber(row.longitude ?? row.lng ?? row.lon);
        const popValue = row.id_pop ?? row.pop_id ?? row.kode_pop ?? row.pop;

        if (!nama_olt) throw new Error(`nama_olt kosong pada baris ${index + 2}`);
        if (!lokasi) throw new Error(`lokasi kosong pada baris ${index + 2}`);
        if (latitude === null || longitude === null) throw new Error(`latitude/longitude tidak valid pada baris ${index + 2}`);

        let id_pop: number | null = null;
        if (popValue !== null && popValue !== undefined && popValue !== "") {
          const popId = toNumber(popValue);
          if (popId !== null) {
            id_pop = popId;
          } else {
            const popCode = normalizeString(popValue);
            const pop = popCode ? await prisma.pop.findUnique({ where: { kode_pop: popCode } }) : null;
            if (!pop) throw new Error(`POP dengan kode "${popCode}" tidak ditemukan pada baris ${index + 2}`);
            id_pop = pop.id_pop;
          }
        }

        if (id_pop === null) throw new Error(`id_pop / kode_pop wajib diisi pada baris ${index + 2}`);

        const kode_olt = normalizeString(row.kode_olt ?? row.kode ?? row.olt_code) || (await generateKodeOlt());
        const ip_olt = normalizeString(row.ip_olt ?? row.ip);
        const username_olt = normalizeString(row.username_olt ?? row.username);
        const password_olt = normalizeString(row.password_olt ?? row.password);
        const foto_olt = normalizeString(row.foto_olt ?? row.foto ?? row.image);

        return {
          kode_olt,
          nama_olt,
          lokasi,
          latitude,
          longitude,
          id_pop,
          ip_olt,
          username_olt,
          password_olt,
          foto_olt,
        };
      })
    );

    const duplicateKode = isDuplicate(data.map((item) => item.kode_olt));
    const duplicateNama = isDuplicate(data.map((item) => item.nama_olt));

    if (duplicateKode.length > 0 || duplicateNama.length > 0) {
      return NextResponse.json(
        { success: false, message: "Kode OLT atau Nama OLT duplikat di Excel", duplicateKode, duplicateNama },
        { status: 400 }
      );
    }

    for (const item of data) {
      const exists = await prisma.olt.findFirst({
        where: {
          OR: [{ kode_olt: item.kode_olt }, { nama_olt: item.nama_olt }],
        },
      });

      if (exists) {
        throw new Error(`OLT dengan kode/nama "${item.kode_olt}" atau "${item.nama_olt}" sudah ada`);
      }
    }

    const result = await prisma.olt.createMany({ data });

    return NextResponse.json({ success: true, message: "Import OLT berhasil", totalImport: result.count });
  } catch (error: any) {
    console.error("IMPORT OLT ERROR:", error);
    return NextResponse.json({ success: false, message: error.message || "Import OLT gagal" }, { status: 500 });
  }
}
