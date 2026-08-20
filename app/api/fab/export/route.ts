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
        whereClause = { id_fab: { in: ids } };
      }
    }

    // Ambil data FAB dengan relasi
    const allFab = await prisma.fab.findMany({
      where: whereClause,
      include: {
        area: true,
        paket: true,
        users: true,
        penginput: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (allFab.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data FAB untuk diekspor" },
        { status: 404 }
      );
    }

    // Format data untuk Excel
    const exportData = allFab.map((fab, index) => ({
      No: index + 1,
      "Kode FAB": fab.kode_fab,
      "Nama Pelanggan": fab.nama_pelanggan,
      "NIK": fab.nik,
      "No. HP": fab.no_hp,
      "Alamat": fab.alamat,
      "Area": fab.area?.nama_area || "",
      "Paket": fab.paket?.nama_paket || "",
      "Kecepatan": fab.paket?.kecepatan || "",
      "Harga Paket": fab.paket?.harga ? Number(fab.paket.harga) : "",
      "Sales": fab.users?.nama || "",
      "Diinput Oleh": fab.penginput?.nama || "",
      "Status": fab.status,
      "Latitude": fab.latitude ? Number(fab.latitude) : "",
      "Longitude": fab.longitude ? Number(fab.longitude) : "",
      "Tanggal Dibuat": fab.createdAt ? new Date(fab.createdAt).toLocaleDateString("id-ID") : "",
    }));

    // Buat workbook dan worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 5 },   // No
      { wch: 12 },  // Kode FAB
      { wch: 25 },  // Nama Pelanggan
      { wch: 18 },  // NIK
      { wch: 15 },  // No. HP
      { wch: 30 },  // Alamat
      { wch: 20 },  // Area
      { wch: 20 },  // Paket
      { wch: 15 },  // Kecepatan
      { wch: 15 },  // Harga Paket
      { wch: 20 },  // Sales
      { wch: 20 },  // Diinput Oleh
      { wch: 10 },  // Status
      { wch: 15 },  // Latitude
      { wch: 15 },  // Longitude
      { wch: 15 },  // Tanggal Dibuat
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data FAB");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename dengan timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Export_FAB_${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("EXPORT FAB ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat mengekspor data" },
      { status: 500 }
    );
  }
}
