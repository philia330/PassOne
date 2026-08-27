import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Sesi tidak valid." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { theme_preference } = body;

    // Validate theme preference
    const validThemes = ["LIGHT", "DARK", "SYSTEM"];
    if (!validThemes.includes(theme_preference)) {
      return NextResponse.json(
        { success: false, message: "Theme preference tidak valid." },
        { status: 400 }
      );
    }

    const userId = Number(session.user.id_user);

    await prisma.user.update({
      where: { id_user: userId },
      data: { theme_preference },
    });

    return NextResponse.json({
      success: true,
      message: "Theme preference berhasil disimpan.",
    });
  } catch (error) {
    console.error("Failed to update theme preference:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan theme preference." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Sesi tidak valid." },
        { status: 401 }
      );
    }

    const userId = Number(session.user.id_user);

    const user = await prisma.user.findUnique({
      where: { id_user: userId },
      select: { theme_preference: true },
    });

    return NextResponse.json({
      success: true,
      theme_preference: user?.theme_preference ?? "SYSTEM",
    });
  } catch (error) {
    console.error("Failed to get theme preference:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil theme preference." },
      { status: 500 }
    );
  }
}
