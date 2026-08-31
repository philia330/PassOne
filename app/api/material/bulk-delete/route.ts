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
    const materials = await prisma.material.findMany({
      where: { id_material: { in: ids } },
      select: { id_material: true, nama_material: true, _count: { select: { baadetail: true } } },
    });

    if (materials.length !== ids.length) {
      return NextResponse.json(
        { success: false, message: "Beberapa material tidak ditemukan." },
        { status: 404 }
      );
    }

    // Check for materials with dependencies
    const materialsWithDeps = materials.filter((m) => m._count.baadetail > 0);

    if (materialsWithDeps.length > 0) {
      const names = materialsWithDeps.map((m) => m.nama_material).join(", ");
      return NextResponse.json(
        { success: false, message: `Material "${names}" tidak dapat dihapus karena masih digunakan di instalasi (BAA).` },
        { status: 400 }
      );
    }

    // ======================================
    // DELETE
    // ======================================
    await prisma.material.deleteMany({
      where: { id_material: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${ids.length} material.`,
    });

  } catch (error) {
    return handleApiError(error, "MATERIAL_BULK_DELETE");
  }
}
