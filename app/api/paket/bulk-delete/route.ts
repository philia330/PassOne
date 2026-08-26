import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseIdsParam, requireRole, handleApiError } from "@/app/api/_lib/api-validation";
import { Role } from "@/lib/auth/roles";

export async function DELETE(request: Request) {
  try {
    // ======================================
    // VALIDATION: Auth & Permission (ADMIN or LOGISTIK)
    // ======================================
    const authResult = await requireRole([Role.ADMIN, Role.LOGISTIK]);
    if (!authResult.ok) return authResult.response;

    // ======================================
    // VALIDATION: IDs Parameter
    // ======================================
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    const idsResult = parseIdsParam(idsParam);
    if (!idsResult.valid) return idsResult.error;

    const { ids } = idsResult;

    // ======================================
    // CHECK DEPENDENCIES
    // ======================================
    const pakets = await prisma.paket.findMany({
      where: { id_paket: { in: ids } },
      select: { id_paket: true, nama_paket: true, _count: { select: { fab: true } } },
    });

    if (pakets.length !== ids.length) {
      return NextResponse.json(
        { success: false, message: "Beberapa paket tidak ditemukan." },
        { status: 404 }
      );
    }

    // Check for pakets with dependencies
    const paketsWithDeps = pakets.filter((p) => p._count.fab > 0);

    if (paketsWithDeps.length > 0) {
      const names = paketsWithDeps.map((p) => p.nama_paket).join(", ");
      return NextResponse.json(
        { success: false, message: `Paket "${names}" tidak dapat dihapus karena masih digunakan oleh FAB.` },
        { status: 400 }
      );
    }

    // ======================================
    // DELETE
    // ======================================
    await prisma.paket.deleteMany({
      where: { id_paket: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${ids.length} paket.`,
    });

  } catch (error) {
    return handleApiError(error, "PAKET_BULK_DELETE");
  }
}
