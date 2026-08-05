import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "File tidak ditemukan",
        },
        {
          status: 400,
        }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, {
      type: "buffer",
    });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "File Excel kosong",
        },
        {
          status: 400,
        }
      );
    }

    console.log("HEADER :", Object.keys(rows[0]));
    console.log("ROW PERTAMA :", rows[0]);

    const data = rows.map((row, index) => {
      if (
        !row.kode_fab ||
        !row.nama_pelanggan ||
        !row.nik ||
        row.latitude == null ||
        row.longitude == null ||
        row.id_area == null ||
        row.id_paket == null ||
        row.id_user == null ||
        row.id_penginput == null
      ) {
        throw new Error(`Data tidak lengkap pada baris Excel ke-${index + 2}`);
      }

      return {
        kode_fab: String(row.kode_fab).trim(),
        nama_pelanggan: String(row.nama_pelanggan).trim(),
        nik: String(row.nik).trim(),
        foto: row.foto ? String(row.foto).trim() : null,
        no_hp: String(row.no_hp).trim(),
        alamat: String(row.alamat).trim(),

        latitude: new Prisma.Decimal(row.latitude),
        longitude: new Prisma.Decimal(row.longitude),

        status: String(row.status).toUpperCase(),

        id_area: Number(row.id_area),
        id_paket: Number(row.id_paket),
        id_user: Number(row.id_user),
        id_penginput: Number(row.id_penginput),
      };
    });

    console.log("Jumlah Data :", data.length);
    console.log("DATA PERTAMA :", data[0]);

    // Cek duplikat NIK di file Excel
    const nikList = data.map((d) => d.nik);
    const duplicateNik = nikList.filter(
      (nik, index) => nikList.indexOf(nik) !== index
    );

    if (duplicateNik.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Terdapat NIK duplikat di file Excel.",
          duplicateNik,
        },
        {
          status: 400,
        }
      );
    }

    const result = await prisma.fab.createMany({
      data,
    });

    return NextResponse.json({
      success: true,
      message: "Import berhasil",
      totalImport: result.count,
    });
  } catch (error: any) {
    console.error("========== IMPORT ERROR ==========");
    console.error(error);
    console.error("==================================");

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}