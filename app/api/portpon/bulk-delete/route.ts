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
    // Port PON doesn't have direct Prisma relation to BAA (uses plain Int fields)
    // So we only check if the ports exist
    const ports = await prisma.portPon.findMany({
      where: { id_port: { in: ids } },
      select: { id_port: true, nomor_port: true, tipe_kartu: true },
    });

    if (ports.length !== ids.length) {
      const foundIds = ports.map((p) => p.id_port);
      const missingIds = ids.filter((id) => !foundIds.includes(id));
      return NextResponse.json(
        { success: false, message: `Port PON dengan ID ${missingIds.join(", ")} tidak ditemukan.` },
        { status: 404 }
      );
    }

    // ======================================
    // DELETE
    // ======================================
    await prisma.portPon.deleteMany({
      where: { id_port: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${ids.length} Port PON.`,
    });

  } catch (error) {
    return handleApiError(error, "PORT_PON_BULK_DELETE");
  }
}
