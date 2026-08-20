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
        whereClause = { id_baa: { in: ids } };
      }
    }

    // Ambil data BAA dengan relasi
    const allBaa = await prisma.baa.findMany({
      where: whereClause,
      include: {
        fab: {
          include: {
            area: true,
            paket: true,
            users: true,
          },
        },
        users: true,
        olt: true,
        odp: true,
        ont: true,
        baadetail: {
          include: {
            material: true,
          },
        },
        teknisiTambahan: {
          include: {
            users: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (allBaa.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data BAA untuk diekspor" },
        { status: 404 }
      );
    }

    // Format data untuk Excel
    const exportData = allBaa.map((baa, index) => {
      // Hitung total material
      const totalMaterial = baa.baadetail.reduce((sum, d) => sum + d.jumlah, 0);
      const totalHarga = baa.baadetail.reduce(
        (sum, d) => sum + (d.material?.harga ? Number(d.material.harga) * d.jumlah : 0),
        0
      );

      // Teknisi tambahan
      const teknisiTambahan = baa.teknisiTambahan
        .map((t) => t.users?.nama)
        .filter(Boolean)
        .join(", ");

      // Format rx_power, tx_power, ping
      const rxPower = baa.rx_power_dbm ? Number(baa.rx_power_dbm) : null;
      const txPower = baa.tx_power_dbm ? Number(baa.tx_power_dbm) : null;
      const ping = baa.ping_ms ? Number(baa.ping_ms) : null;

      return {
        No: index + 1,
        "Kode BAA": baa.kode_baa,
        "Kode FAB": baa.fab?.kode_fab || "",
        "Nama Pelanggan": baa.fab?.nama_pelanggan || "",
        "Alamat": baa.fab?.alamat || "",
        "No. HP": baa.fab?.no_hp || "",
        "Paket": baa.fab?.paket?.nama_paket || "",
        "Kecepatan": baa.fab?.paket?.kecepatan || "",
        "Harga Paket": baa.fab?.paket?.harga ? Number(baa.fab.paket.harga) : "",
        "Area": baa.fab?.area?.nama_area || "",
        "Sales": baa.fab?.users?.nama || "",
        "Tanggal Instalasi": baa.tanggal_instalasi
          ? new Date(baa.tanggal_instalasi).toLocaleDateString("id-ID")
          : "",
        "Teknisi Utama": baa.users?.nama || "",
        "Teknisi Tambahan": teknisiTambahan || "-",
        "OLT": baa.olt?.nama_olt || "",
        "Port OLT": baa.port_olt || "",
        "ODP": baa.odp?.nama_odp || "",
        "Port ODP": baa.port_odp || "",
        "ONT SN": baa.ont?.serial_number || "",
        "RX Power (dBm)": rxPower,
        "TX Power (dBm)": txPower,
        "Ping (ms)": ping,
        "Speed Download": baa.speed_download || "",
        "Speed Upload": baa.speed_upload || "",
        "Total Item Material": totalMaterial,
        "Total Harga Material": totalHarga,
        "Catatan": baa.catatan || "",
        "Status": baa.status,
      };
    });

    // Buat workbook dan worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 5 },   // No
      { wch: 12 },  // Kode BAA
      { wch: 12 },  // Kode FAB
      { wch: 25 },  // Nama Pelanggan
      { wch: 30 },  // Alamat
      { wch: 15 },  // No. HP
      { wch: 20 },  // Paket
      { wch: 15 },  // Kecepatan
      { wch: 15 },  // Harga Paket
      { wch: 15 },  // Area
      { wch: 20 },  // Sales
      { wch: 15 },  // Tanggal
      { wch: 20 },  // Teknisi Utama
      { wch: 25 },  // Teknisi Tambahan
      { wch: 20 },  // OLT
      { wch: 10 },  // Port OLT
      { wch: 20 },  // ODP
      { wch: 10 },  // Port ODP
      { wch: 20 },  // ONT SN
      { wch: 12 },  // RX Power
      { wch: 12 },  // TX Power
      { wch: 10 },  // Ping
      { wch: 15 },  // Speed Download
      { wch: 15 },  // Speed Upload
      { wch: 15 },  // Total Item
      { wch: 15 },  // Total Harga
      { wch: 30 },  // Catatan
      { wch: 10 },  // Status
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data BAA");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename dengan timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Export_BAA_${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("EXPORT BAA ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat mengekspor data" },
      { status: 500 }
    );
  }
}
