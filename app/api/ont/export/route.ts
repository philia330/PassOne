import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  try {
    const session = await auth();

    // Only ADMIN, LOGISTIK, and TEKNISI can export
    const allowedRoles = [Role.ADMIN, Role.LOGISTIK, Role.TEKNISI];
    if (!session || !allowedRoles.includes(session.user?.role as Role)) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Hanya Admin, Logistik, atau Teknisi yang dapat mengekspor data." },
        { status: 403 }
      );
    }

    // Ambil semua data ONT dengan relasi
    const allOnts = await prisma.ont.findMany({
      include: {
        pop: true,
        odp: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (allOnts.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data ONT untuk diekspor" },
        { status: 404 }
      );
    }

    // Format data untuk Excel
    const exportData = allOnts.map((ont, index) => ({
      No: index + 1,
      "Serial Number": ont.serial_number,
      "Nama Pelanggan": ont.pelanggan,
      "Status": ont.status,
      "POP": ont.pop?.nama_pop || "",
      "ODP": ont.odp?.nama_odp || "",
      "Tanggal Dibuat": ont.createdAt ? new Date(ont.createdAt).toLocaleDateString("id-ID") : "",
    }));

    // Buat workbook dan worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 5 },   // No
      { wch: 20 },  // Serial Number
      { wch: 25 },  // Nama Pelanggan
      { wch: 12 },  // Status
      { wch: 20 },  // POP
      { wch: 25 },  // ODP
      { wch: 15 },  // Tanggal Dibuat
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data ONT");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename dengan timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Export_ONT_${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("EXPORT ONT ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat mengekspor data" },
      { status: 500 }
    );
  }
}
