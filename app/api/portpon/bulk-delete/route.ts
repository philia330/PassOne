import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    // Only ADMIN can delete
    if (!session || session.user?.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Hanya Admin yang dapat menghapus data." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json(
        { success: false, message: "ID tidak valid" },
        { status: 400 }
      );
    }

    const ids = idsParam.split(",").map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data yang dipilih" },
        { status: 400 }
      );
    }

    // Delete Port PON
    await prisma.portPon.deleteMany({
      where: {
        id_port: { in: ids },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${ids.length} data Port PON`,
    });

  } catch (error) {
    console.error("BULK DELETE PORT PON ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat menghapus data" },
      { status: 500 }
    );
  }
}
