import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import * as XLSX from "xlsx";

export async function POST(request: Request) {
  // Proteksi: Hanya ADMIN yang boleh import
  const session = await auth();
  if (!session || session.user?.role !== Role.ADMIN) {
    return NextResponse.json(
      { success: false, message: "Akses ditolak. Hanya Admin yang dapat mengimpor data." },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "File Excel kosong" },
        { status: 400 }
      );
    }

    console.log("HEADER :", Object.keys(rows[0]));
    console.log("ROW PERTAMA :", rows[0]);

    const data = rows.map((row, index) => {
      if (
        !row.kode_baa ||
        !row.tanggal_instalasi ||
        row.id_fab == null ||
        row.id_user == null ||
        row.id_olt == null ||
        row.id_odp == null
      ) {
        throw new Error(`Data tidak lengkap pada baris Excel ke-${index + 2}`);
      }

      return {
        kode_baa: String(row.kode_baa).trim(),

        tanggal_instalasi: new Date(row.tanggal_instalasi),

        status: "SELESAI" as const,

        catatan: row.catatan
          ? String(row.catatan).trim()
          : null,

        foto_instalasi: row.foto_instalasi
          ? String(row.foto_instalasi).trim()
          : null,

        id_fab: Number(row.id_fab),
        id_user: Number(row.id_user),
        id_olt: Number(row.id_olt),
        id_odp: Number(row.id_odp),

        id_ont: row.id_ont
          ? Number(row.id_ont)
          : null,

        ping_ms: row.ping_ms
          ? new Prisma.Decimal(row.ping_ms)
          : null,

        port_odp: row.port_odp
          ? Number(row.port_odp)
          : null,

        port_olt: row.port_olt
          ? Number(row.port_olt)
          : null,

        rx_power_dbm: row.rx_power_dbm
          ? new Prisma.Decimal(row.rx_power_dbm)
          : null,

        speed_download: row.speed_download
          ? String(row.speed_download)
          : null,

        speed_upload: row.speed_upload
          ? String(row.speed_upload)
          : null,

        tx_power_dbm: row.tx_power_dbm
          ? new Prisma.Decimal(row.tx_power_dbm)
          : null,
      };
    });

    const kodeList = data.map((d) => d.kode_baa);

    const duplicate = kodeList.filter(
      (kode, index) => kodeList.indexOf(kode) !== index
    );

    if (duplicate.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Kode BAA duplikat di Excel",
          duplicate,
        },
        { status: 400 }
      );
    }

    const result = await prisma.baa.createMany({
      data,
    });

    return NextResponse.json({
      success: true,
      message: "Import BAA berhasil",
      totalImport: result.count,
    });

  } catch (error: any) {
    console.error("IMPORT BAA ERROR :", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}