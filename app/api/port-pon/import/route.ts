import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseExcelFile, requireAdmin, normalizeString, isDuplicate, toNumber } from "@/app/api/_lib/import-utils";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  return NextResponse.json({ success: true, message: "API Import Port PON aktif" });
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
        const nomor_port = toNumber(row.nomor_port ?? row.port ?? row.port_number);
        const tipe_kartu = normalizeString(row.tipe_kartu ?? row.tipe ?? row.kartu) || "GPON";
        const statusValue = normalizeString(row.status ?? row.sts) || "TERSEDIA";
        const status = statusValue === "TERPASANG" || statusValue === "RUSAK" || statusValue === "TERSEDIA" ? statusValue : "TERSEDIA";

        if (nomor_port === null || nomor_port <= 0) throw new Error(`nomor_port tidak valid pada baris ${index + 2}`);

        const oltValue = row.id_olt ?? row.olt_id ?? row.kode_olt ?? row.olt;
        let id_olt: number | null = null;
        if (oltValue !== null && oltValue !== undefined && oltValue !== "") {
          const oltId = toNumber(oltValue);
          if (oltId !== null) {
            id_olt = oltId;
          } else {
            const oltCode = normalizeString(oltValue);
            const olt = oltCode ? await prisma.olt.findUnique({ where: { kode_olt: oltCode } }) : null;
            if (!olt) throw new Error(`OLT dengan kode "${oltCode}" tidak ditemukan pada baris ${index + 2}`);
            id_olt = olt.id_olt;
          }
        }

        const odpValue = row.id_odp ?? row.odp_id ?? row.kode_odp ?? row.odp;
        let id_odp: number | null = null;
        if (odpValue !== null && odpValue !== undefined && odpValue !== "") {
          const odpId = toNumber(odpValue);
          if (odpId !== null) {
            id_odp = odpId;
          } else {
            const odpCode = normalizeString(odpValue);
            const odp = odpCode ? await prisma.odp.findUnique({ where: { kode_odp: odpCode } }) : null;
            if (!odp) throw new Error(`ODP dengan kode "${odpCode}" tidak ditemukan pada baris ${index + 2}`);
            id_odp = odp.id_odp;
          }
        }

        if (id_olt === null) throw new Error(`id_olt / kode_olt wajib diisi pada baris ${index + 2}`);

        return {
          nomor_port,
          tipe_kartu,
          status,
          id_olt,
          id_odp,
        };
      })
    );

    for (const item of data) {
      const exists = await prisma.portPon.findFirst({
        where: {
          id_olt: item.id_olt,
          nomor_port: item.nomor_port,
        },
      });

      if (exists) {
        throw new Error(`Port ${item.nomor_port} pada OLT ${item.id_olt} sudah ada`);
      }
    }

    const result = await prisma.portPon.createMany({ data: data as any });

    return NextResponse.json({ success: true, message: "Import Port PON berhasil", totalImport: result.count });
  } catch (error: any) {
    console.error("IMPORT PORTPON ERROR:", error);
    return NextResponse.json({ success: false, message: error.message || "Import Port PON gagal" }, { status: 500 });
  }
}
