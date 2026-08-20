import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  try {
    const session = await auth();

    // Only ADMIN and TEKNISI can export
    const allowedRoles = [Role.ADMIN, Role.TEKNISI];
    if (!session || !allowedRoles.includes(session.user?.role as Role)) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Hanya Admin atau Teknisi yang dapat mengekspor data." },
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
        whereClause = { id_port: { in: ids } };
      }
    }

    // Ambil data Port PON dengan relasi
    const allPorts = await prisma.portPon.findMany({
      where: whereClause,
      include: {
        olt: true,
        odp: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (allPorts.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data Port PON untuk diekspor" },
        { status: 404 }
      );
    }

    // Format data untuk Excel
    const exportData = allPorts.map((port, index) => ({
      No: index + 1,
      "Nomor Port": port.nomor_port,
      "Tipe Kartu": port.tipe_kartu,
      "Status": port.status,
      "OLT": port.olt?.nama_olt || "",
      "Kode OLT": port.olt?.kode_olt || "",
      "ODP": port.odp?.nama_odp || "-",
      "Kode ODP": port.odp?.kode_odp || "-",
      "Tanggal Dibuat": port.createdAt ? new Date(port.createdAt).toLocaleDateString("id-ID") : "",
    }));

    // Buat workbook dan worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 5 },   // No
      { wch: 12 },  // Nomor Port
      { wch: 15 },  // Tipe Kartu
      { wch: 12 },  // Status
      { wch: 25 },  // OLT
      { wch: 12 },  // Kode OLT
      { wch: 25 },  // ODP
      { wch: 12 },  // Kode ODP
      { wch: 15 },  // Tanggal Dibuat
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Port PON");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename dengan timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Export_Port_PON_${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("EXPORT PORT PON ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat mengekspor data" },
      { status: 500 }
    );
  }
}
