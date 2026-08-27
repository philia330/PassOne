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
    const olts = await prisma.olt.findMany({
      where: { id_olt: { in: ids } },
      select: { id_olt: true, nama_olt: true, _count: { select: { odp: true, portpon: true } } },
    });

    if (olts.length !== ids.length) {
      return NextResponse.json(
        { success: false, message: "Beberapa OLT tidak ditemukan." },
        { status: 404 }
      );
    }

    // Check for OLTs with dependencies
    const oltsWithDeps = olts.filter((o) => o._count.odp > 0 || o._count.portpon > 0);

    if (oltsWithDeps.length > 0) {
      const names = oltsWithDeps.map((o) => o.nama_olt).join(", ");
      return NextResponse.json(
        { success: false, message: `OLT "${names}" tidak dapat dihapus karena masih memiliki data ODP atau Port PON terkait.` },
        { status: 400 }
      );
    }

    // ======================================
    // DELETE
    // ======================================
    await prisma.olt.deleteMany({
      where: { id_olt: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${ids.length} OLT.`,
    });

  } catch (error) {
    return handleApiError(error, "OLT_BULK_DELETE");
  }
}
