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
    const areas = await prisma.area.findMany({
      where: { id_area: { in: ids } },
      select: { id_area: true, nama_area: true, _count: { select: { fab: true, pop: true } } },
    });

    if (areas.length !== ids.length) {
      return NextResponse.json(
        { success: false, message: "Beberapa area tidak ditemukan." },
        { status: 404 }
      );
    }

    // Check for areas with dependencies
    const areasWithDeps = areas.filter((a) => a._count.fab > 0 || a._count.pop > 0);

    if (areasWithDeps.length > 0) {
      const names = areasWithDeps.map((a) => a.nama_area).join(", ");
      return NextResponse.json(
        { success: false, message: `Area "${names}" tidak dapat dihapus karena masih memiliki data POP atau FAB terkait.` },
        { status: 400 }
      );
    }

    // ======================================
    // DELETE
    // ======================================
    await prisma.area.deleteMany({
      where: { id_area: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${ids.length} area.`,
    });

  } catch (error) {
    return handleApiError(error, "AREA_BULK_DELETE");
  }
}
