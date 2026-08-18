import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  try {
    const session = await auth();

    // Only ADMIN and LOGISTIK can export
    const allowedRoles = [Role.ADMIN, Role.LOGISTIK];
    if (!session || !allowedRoles.includes(session.user?.role as Role)) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Hanya Admin atau Logistik yang dapat mengekspor data." },
        { status: 403 }
      );
    }

    // Ambil semua data Material
    const allMaterials = await prisma.material.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (allMaterials.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data Material untuk diekspor" },
        { status: 404 }
      );
    }

    // Format data untuk Excel
    const exportData = allMaterials.map((material, index) => ({
      No: index + 1,
      "Kode Material": material.kode_material,
      "Nama Material": material.nama_material,
      "Satuan": material.satuan,
      "Stok": material.stok,
      "Minimal Stok": material.minimal_stok,
      "Harga": material.harga ? Number(material.harga) : 0,
      "Kondisi": material.kondisi,
      "Keterangan": material.keterangan || "",
      "Tanggal Dibuat": material.createdAt ? new Date(material.createdAt).toLocaleDateString("id-ID") : "",
    }));

    // Buat workbook dan worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 5 },   // No
      { wch: 15 },  // Kode Material
      { wch: 30 },  // Nama Material
      { wch: 10 },  // Satuan
      { wch: 8 },   // Stok
      { wch: 10 },  // Minimal Stok
      { wch: 15 },  // Harga
      { wch: 10 },  // Kondisi
      { wch: 30 },  // Keterangan
      { wch: 15 },  // Tanggal Dibuat
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Material");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename dengan timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Export_Material_${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("EXPORT MATERIAL ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat mengekspor data" },
      { status: 500 }
    );
  }
}
