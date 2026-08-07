"use server";

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";

/**
 * ======================================
 * POST: Clear Next.js cache
 * ======================================
 */
export async function POST() {
  const session = await auth();

  if (!session || session.user?.role !== Role.ADMIN) {
    return NextResponse.json(
      { success: false, message: "Akses ditolak. Hanya Admin yang dapat mengakses." },
      { status: 403 }
    );
  }

  try {
    // Revalidate all paths
    revalidatePath("/", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/workspace");
    revalidatePath("/jaringan/fab");
    revalidatePath("/jaringan/baa");
    revalidatePath("/masterdata/area");
    revalidatePath("/masterdata/material");
    revalidatePath("/masterdata/odp");
    revalidatePath("/masterdata/olt");
    revalidatePath("/masterdata/ont");
    revalidatePath("/masterdata/paket");
    revalidatePath("/masterdata/pop");
    revalidatePath("/masterdata/port-pon");
    revalidatePath("/masterdata/user");

    return NextResponse.json({
      success: true,
      message: "Cache berhasil dibersihkan. Semua data telah di-refresh.",
    });
  } catch (error) {
    console.error("Cache clear error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membersihkan cache." },
      { status: 500 }
    );
  }
}
