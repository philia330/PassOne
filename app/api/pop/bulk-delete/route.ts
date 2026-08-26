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
    const pops = await prisma.pop.findMany({
      where: { id_pop: { in: ids } },
      select: { id_pop: true, nama_pop: true, _count: { select: { olt: true, ont: true } } },
    });

    if (pops.length !== ids.length) {
      return NextResponse.json(
        { success: false, message: "Beberapa POP tidak ditemukan." },
        { status: 404 }
      );
    }

    // Check for pops with dependencies
    const popsWithDeps = pops.filter((p) => p._count.olt > 0 || p._count.ont > 0);

    if (popsWithDeps.length > 0) {
      const names = popsWithDeps.map((p) => p.nama_pop).join(", ");
      return NextResponse.json(
        { success: false, message: `POP "${names}" tidak dapat dihapus karena masih memiliki data OLT atau ONT terkait.` },
        { status: 400 }
      );
    }

    // ======================================
    // DELETE
    // ======================================
    await prisma.pop.deleteMany({
      where: { id_pop: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${ids.length} POP.`,
    });

  } catch (error) {
    return handleApiError(error, "POP_BULK_DELETE");
  }
}
