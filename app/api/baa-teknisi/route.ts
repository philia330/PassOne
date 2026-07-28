import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Ambil semua teknisi tambahan untuk BAA tertentu
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const baaId = searchParams.get("baaId");

  if (!baaId) {
    return NextResponse.json(
      { error: "baaId wajib diisi" },
      { status: 400 }
    );
  }

  try {
    // ✅ Perbaiki: baaTeknisi → baateknisi
    const teknisi = await prisma.baateknisi.findMany({
      where: { id_baa: Number(baaId) },
      include: {
        users: {
          // ✅ users (bukan user)
          select: {
            id_user: true,
            nama: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(teknisi);
  } catch (error) {
    console.error("Error fetching teknisi tambahan:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data teknisi" },
      { status: 500 }
    );
  }
}

// POST: Tambah teknisi tambahan ke BAA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_baa, id_user } = body;

    if (!id_baa || !id_user) {
      return NextResponse.json(
        { error: "id_baa dan id_user wajib diisi" },
        { status: 400 }
      );
    }

    // ✅ Perbaiki: baaTeknisi → baateknisi
    const existing = await prisma.baateknisi.findUnique({
      where: {
        id_baa_id_user: {
          id_baa: Number(id_baa),
          id_user: Number(id_user),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Teknisi sudah ditambahkan ke BAA ini" },
        { status: 400 }
      );
    }

    // ✅ Perbaiki: baaTeknisi → baateknisi
    const result = await prisma.baateknisi.create({
      data: {
        id_baa: Number(id_baa),
        id_user: Number(id_user),
      },
      include: {
        users: {
          // ✅ users (bukan user)
          select: {
            id_user: true,
            nama: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error adding teknisi tambahan:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan teknisi" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus teknisi tambahan dari BAA
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "id wajib diisi" },
      { status: 400 }
    );
  }

  try {
    // ✅ Perbaiki: baaTeknisi → baateknisi
    await prisma.baateknisi.delete({
      where: { id_baa_teknisi: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting teknisi tambahan:", error);
    return NextResponse.json(
      { error: "Gagal menghapus teknisi" },
      { status: 500 }
    );
  }
}