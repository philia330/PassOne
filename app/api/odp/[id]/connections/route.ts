import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const odpId = parseInt(id);

    if (isNaN(odpId)) {
      return NextResponse.json(
        { error: "Invalid ODP ID" },
        { status: 400 }
      );
    }

    // Ambil ONT yang terhubung ke ODP ini
    const ont = await prisma.ont.findMany({
      where: { id_odp: odpId },
      select: {
        id_ont: true,
        serial_number: true,
        pelanggan: true,
        status: true,
      },
      orderBy: { serial_number: "asc" },
    });

    // Ambil BAA yang menggunakan ODP ini
    const baa = await prisma.baa.findMany({
      where: { id_odp: odpId },
      select: {
        id_baa: true,
        kode_baa: true,
        fab: {
          select: {
            nama_pelanggan: true,
          },
        },
      },
      orderBy: { kode_baa: "asc" },
    });

    return NextResponse.json({
      ont,
      baa,
    });
  } catch (error) {
    console.error("Error fetching ODP connections:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data" },
      { status: 500 }
    );
  }
}
