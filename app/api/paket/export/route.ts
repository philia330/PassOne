import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  try {
    const session = await auth();

    // Only ADMIN and LEADER can export
    if (!session || (session.user?.role !== Role.ADMIN && session.user?.role !== Role.LEADER)) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Hanya Admin atau Leader yang dapat mengekspor data." },
        { status: 403 }
      );
    }

    // Parse query params untuk filter by IDs
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");
    let whereClause: any = {};

    if (idsParam) {
      const ids = idsParam.split(",").map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
      if (ids.length > 0) {
        whereClause = { id_paket: { in: ids } };
      }
    }

    // Ambil data Paket
    const allPakets = await prisma.paket.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    if (allPakets.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data Paket untuk diekspor" },
        { status: 404 }
      );
    }

    // Format data untuk Excel
    const exportData = allPakets.map((paket, index) => ({
      No: index + 1,
      "Kode Paket": paket.kode_paket,
      "Nama Paket": paket.nama_paket,
      "Kecepatan": paket.kecepatan,
      "Harga": paket.harga ? Number(paket.harga) : 0,
      "Keterangan": paket.keterangan || "",
      "Tanggal Dibuat": paket.createdAt ? new Date(paket.createdAt).toLocaleDateString("id-ID") : "",
    }));

    // Buat workbook dan worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 5 },   // No
      { wch: 15 },  // Kode Paket
      { wch: 25 },  // Nama Paket
      { wch: 15 },  // Kecepatan
      { wch: 15 },  // Harga
      { wch: 30 },  // Keterangan
      { wch: 15 },  // Tanggal Dibuat
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Paket");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename dengan timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Export_Paket_${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("EXPORT PAKET ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat mengekspor data" },
      { status: 500 }
    );
  }
}
