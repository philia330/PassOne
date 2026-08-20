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
        whereClause = { id_user: { in: ids } };
      }
    }

    // Ambil data User
    const allUsers = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    if (allUsers.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data User untuk diekspor" },
        { status: 404 }
      );
    }

    // Format data untuk Excel
    const exportData = allUsers.map((user, index) => ({
      No: index + 1,
      "Kode User": user.kode_user,
      "Nama": user.nama,
      "Username": user.username,
      "Email": user.email || "",
      "No. HP": user.no_hp || "",
      "Role": user.role,
      "Jenis Kelamin": user.jkl === "LAKI_LAKI" ? "Laki-laki" : "Perempuan",
      "Status": user.status ? "Aktif" : "Nonaktif",
      "Tanggal Dibuat": user.createdAt ? new Date(user.createdAt).toLocaleDateString("id-ID") : "",
    }));

    // Buat workbook dan worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 5 },   // No
      { wch: 12 },  // Kode User
      { wch: 25 },  // Nama
      { wch: 20 },  // Username
      { wch: 30 },  // Email
      { wch: 15 },  // No. HP
      { wch: 12 },  // Role
      { wch: 15 },  // Jenis Kelamin
      { wch: 10 },  // Status
      { wch: 15 },  // Tanggal Dibuat
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data User");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename dengan timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Export_User_${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("EXPORT USER ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat mengekspor data" },
      { status: 500 }
    );
  }
}
