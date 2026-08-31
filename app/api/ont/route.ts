import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/api-guard";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json(
        { message: "Parameter 'ids' diperlukan" },
        { status: 400 }
      );
    }

    const ids = idsParam.split(",").map((id) => parseInt(id.trim())).filter((id) => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json(
        { message: "Minimal satu ID ONT diperlukan" },
        { status: 400 }
      );
    }

    const onts = await prisma.ont.findMany({
      where: {
        id_ont: { in: ids },
      },
      select: {
        id_ont: true,
        serial_number: true,
        model: true,
        pelanggan: true,
        status: true,
      },
      orderBy: {
        serial_number: "asc",
      },
    });

    return NextResponse.json(onts);
  } catch (error) {
    console.error("Error fetching ONTs:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
