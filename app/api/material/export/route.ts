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
        whereClause = { id_material: { in: ids } };
      }
    }

    // Ambil data Material dengan data BAA usage
    const allMaterials = await prisma.material.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        baadetail: {
          include: {
            baa: {
              include: {
                fab: {
                  select: {
                    nama_pelanggan: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (allMaterials.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data Material untuk diekspor" },
        { status: 404 }
      );
    }

    // Format data untuk Excel dengan informasi BAA usage
    const exportData = allMaterials.map((material, index) => {
      // Aggregate BAA usage
      const totalDigunakan = material.baadetail.reduce((sum, detail) => sum + detail.jumlah, 0);
      const jumlahBaa = material.baadetail.length;

      // Create list of BAA codes used
      const baaList = material.baadetail
        .map((detail) => `${detail.baa.kode_baa} (${detail.jumlah} ${material.satuan})`)
        .join("; ");

      return {
        No: index + 1,
        "Kode Material": material.kode_material,
        "Nama Material": material.nama_material,
        "Satuan": material.satuan,
        "Stok": material.stok,
        "Minimal Stok": material.minimal_stok,
        "Harga": material.harga ? Number(material.harga) : 0,
        "Kondisi": material.kondisi,
        "Keterangan": material.keterangan || "",
        "Total Digunakan": totalDigunakan,
        "Jumlah BAA": jumlahBaa,
        "Daftar BAA (Kode - Jumlah)": baaList || "-",
        "Tanggal Dibuat": material.createdAt ? new Date(material.createdAt).toLocaleDateString("id-ID") : "",
      };
    });

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
      { wch: 15 },  // Total Digunakan
      { wch: 12 },  // Jumlah BAA
      { wch: 50 },  // Daftar BAA
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
