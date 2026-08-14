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

    // Ambil semua data ODP dengan relasi
    const allOdps = await prisma.odp.findMany({
      include: {
        olt: {
          include: {
            pop: {
              include: {
                area: true,
              },
            },
          },
        },
        _count: {
          select: {
            ont: true,
            baa: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (allOdps.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data ODP untuk diekspor" },
        { status: 404 }
      );
    }

    // Format data untuk Excel
    const exportData = allOdps.map((odp, index) => ({
      No: index + 1,
      "Kode ODP": odp.kode_odp,
      "Nama ODP": odp.nama_odp,
      "Alamat": odp.alamat,
      "OLT": odp.olt?.nama_olt || "",
      "POP": odp.olt?.pop?.nama_pop || "",
      "Area": odp.olt?.pop?.area?.nama_area || "",
      "Jumlah Port": odp.jumlah_port || 0,
      "Stok Port": odp.stok_port || 0,
      "ONT Terpasang": odp._count?.ont || 0,
      "BAA": odp._count?.baa || 0,
      "Latitude": odp.latitude ? Number(odp.latitude) : "",
      "Longitude": odp.longitude ? Number(odp.longitude) : "",
      "Tanggal Dibuat": odp.createdAt ? new Date(odp.createdAt).toLocaleDateString("id-ID") : "",
    }));

    // Buat workbook dan worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 5 },   // No
      { wch: 12 },  // Kode ODP
      { wch: 25 },  // Nama ODP
      { wch: 30 },  // Alamat
      { wch: 25 },  // OLT
      { wch: 20 },  // POP
      { wch: 20 },  // Area
      { wch: 10 },  // Jumlah Port
      { wch: 10 },  // Stok Port
      { wch: 12 },  // ONT Terpasang
      { wch: 8 },   // BAA
      { wch: 15 },  // Latitude
      { wch: 15 },  // Longitude
      { wch: 15 },  // Tanggal Dibuat
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data ODP");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename dengan timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Export_ODP_${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("EXPORT ODP ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat mengekspor data" },
      { status: 500 }
    );
  }
}
