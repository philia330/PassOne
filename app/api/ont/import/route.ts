import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseExcelFile, requireAdmin, normalizeString, isDuplicate, toNumber } from "@/app/api/_lib/import-utils";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  return NextResponse.json({ success: true, message: "API Import ONT aktif" });
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
        const serial_number = normalizeString(row.serial_number ?? row.serial ?? row.sn);
        const pelanggan = normalizeString(row.pelanggan ?? row.nama_pelanggan ?? row.customer_name);
        const statusValue = normalizeString(row.status ?? row.sts) || "TERSEDIA";
        const status = statusValue === "TERPASANG" ? "TERSEDIA" : statusValue;

        if (!serial_number) throw new Error(`serial_number kosong pada baris ${index + 2}`);
        if (!pelanggan) throw new Error(`pelanggan kosong pada baris ${index + 2}`);

        const popValue = row.id_pop ?? row.pop_id ?? row.kode_pop ?? row.pop;
        const odpValue = row.id_odp ?? row.odp_id ?? row.kode_odp ?? row.odp;

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

        if (id_pop === null || id_odp === null) {
          throw new Error(`id_pop / kode_pop dan id_odp / kode_odp wajib diisi pada baris ${index + 2}`);
        }

        return {
          serial_number,
          pelanggan,
          status: status === "TERSEDIA" || status === "TERPASANG" || status === "RUSAK" ? status : "TERSEDIA",
          id_pop,
          id_odp,
        };
      })
    );

    const duplicateSerial = isDuplicate(data.map((item) => item.serial_number));

    if (duplicateSerial.length > 0) {
      return NextResponse.json(
        { success: false, message: "Serial Number ONT duplikat di Excel", duplicateSerial },
        { status: 400 }
      );
    }

    for (const item of data) {
      const exists = await prisma.ont.findUnique({ where: { serial_number: item.serial_number } });
      if (exists) {
        throw new Error(`ONT dengan serial_number "${item.serial_number}" sudah ada`);
      }
    }

    const result = await prisma.ont.createMany({ data: data as any });

    return NextResponse.json({ success: true, message: "Import ONT berhasil", totalImport: result.count });
  } catch (error: any) {
    console.error("IMPORT ONT ERROR:", error);
    return NextResponse.json({ success: false, message: error.message || "Import ONT gagal" }, { status: 500 });
  }
}
