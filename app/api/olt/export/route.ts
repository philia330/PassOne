import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  try {
    const session = await auth();

    // Only ADMIN can export
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Hanya Admin yang dapat mengekspor data." },
        { status: 403 }
      );
    }

    // Ambil semua data OLT dengan relasi
    const allOlts = await prisma.olt.findMany({
      include: {
        pop: {
          include: {
            area: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (allOlts.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data OLT untuk diekspor" },
        { status: 404 }
      );
    }

    // Format data untuk Excel
    const exportData = allOlts.map((olt, index) => ({
      No: index + 1,
      "Kode OLT": olt.kode_olt,
      "Nama OLT": olt.nama_olt,
      "Lokasi": olt.lokasi,
      "IP OLT": olt.ip_olt || "",
      "Username": olt.username_olt || "",
      "Password": olt.password_olt ? "***" : "",
      "POP": olt.pop?.nama_pop || "",
      "Area": olt.pop?.area?.nama_area || "",
      "Latitude": olt.latitude ? Number(olt.latitude) : "",
      "Longitude": olt.longitude ? Number(olt.longitude) : "",
      "Tanggal Dibuat": olt.createdAt ? new Date(olt.createdAt).toLocaleDateString("id-ID") : "",
    }));

    // Buat workbook dan worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 5 },   // No
      { wch: 12 },  // Kode OLT
      { wch: 25 },  // Nama OLT
      { wch: 25 },  // Lokasi
      { wch: 15 },  // IP OLT
      { wch: 15 },  // Username
      { wch: 10 },  // Password
      { wch: 20 },  // POP
      { wch: 20 },  // Area
      { wch: 15 },  // Latitude
      { wch: 15 },  // Longitude
      { wch: 15 },  // Tanggal Dibuat
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data OLT");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename dengan timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Export_OLT_${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("EXPORT OLT ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat mengekspor data" },
      { status: 500 }
    );
  }
}
