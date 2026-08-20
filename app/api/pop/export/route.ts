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

    // Parse query params untuk filter by IDs
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");
    let whereClause: any = {};

    if (idsParam) {
      const ids = idsParam.split(",").map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
      if (ids.length > 0) {
        whereClause = { id_pop: { in: ids } };
      }
    }

    // Ambil data POP dengan relasi
    const allPops = await prisma.pop.findMany({
      where: whereClause,
      include: {
        area: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (allPops.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data POP untuk diekspor" },
        { status: 404 }
      );
    }

    // Format data untuk Excel
    const exportData = allPops.map((pop, index) => ({
      No: index + 1,
      "Kode POP": pop.kode_pop,
      "Nama POP": pop.nama_pop,
      "Alamat": pop.alamat,
      "Area": pop.area?.nama_area || "",
      "Latitude": pop.latitude ? Number(pop.latitude) : "",
      "Longitude": pop.longitude ? Number(pop.longitude) : "",
      "Tanggal Dibuat": pop.createdAt ? new Date(pop.createdAt).toLocaleDateString("id-ID") : "",
    }));

    // Buat workbook dan worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 5 },   // No
      { wch: 12 },  // Kode POP
      { wch: 25 },  // Nama POP
      { wch: 30 },  // Alamat
      { wch: 20 },  // Area
      { wch: 15 },  // Latitude
      { wch: 15 },  // Longitude
      { wch: 15 },  // Tanggal Dibuat
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data POP");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename dengan timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Export_POP_${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("EXPORT POP ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat mengekspor data" },
      { status: 500 }
    );
  }
}
