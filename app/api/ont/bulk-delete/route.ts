import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseIdsParam, requireRole, handleApiError } from "@/app/api/_lib/api-validation";
import { Role } from "@/lib/auth/roles";

export async function DELETE(request: Request) {
  try {
    // ======================================
    // VALIDATION: Auth & Permission
    // ======================================
    const authResult = await requireRole([Role.ADMIN]);
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
    const onts = await prisma.ont.findMany({
      where: { id_ont: { in: ids } },
      select: { id_ont: true, serial_number: true, _count: { select: { baa: true } } },
    });

    if (onts.length !== ids.length) {
      return NextResponse.json(
        { success: false, message: "Beberapa ONT tidak ditemukan." },
        { status: 404 }
      );
    }

    // Check for ONTs with dependencies (used in BAA)
    const ontsWithDeps = onts.filter((o) => o._count.baa > 0);

    if (ontsWithDeps.length > 0) {
      const serials = ontsWithDeps.map((o) => o.serial_number).join(", ");
      return NextResponse.json(
        { success: false, message: `ONT dengan serial "${serials}" tidak dapat dihapus karena masih digunakan di instalasi (BAA).` },
        { status: 400 }
      );
    }

    // ======================================
    // DELETE
    // ======================================
    await prisma.ont.deleteMany({
      where: { id_ont: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${ids.length} ONT.`,
    });

  } catch (error) {
    return handleApiError(error, "ONT_BULK_DELETE");
  }
}
