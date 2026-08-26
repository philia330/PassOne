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
    const odps = await prisma.odp.findMany({
      where: { id_odp: { in: ids } },
      select: { id_odp: true, nama_odp: true, _count: { select: { portPon: true, ont: true, baa: true } } },
    });

    if (odps.length !== ids.length) {
      return NextResponse.json(
        { success: false, message: "Beberapa ODP tidak ditemukan." },
        { status: 404 }
      );
    }

    // Check for ODPs with dependencies
    const odpsWithDeps = odps.filter((o) => o._count.portPon > 0 || o._count.ont > 0 || o._count.baa > 0);

    if (odpsWithDeps.length > 0) {
      const names = odpsWithDeps.map((o) => o.nama_odp).join(", ");
      return NextResponse.json(
        { success: false, message: `ODP "${names}" tidak dapat dihapus karena masih memiliki data terkait.` },
        { status: 400 }
      );
    }

    // ======================================
    // DELETE
    // ======================================
    await prisma.odp.deleteMany({
      where: { id_odp: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${ids.length} ODP.`,
    });

  } catch (error) {
    return handleApiError(error, "ODP_BULK_DELETE");
  }
}
