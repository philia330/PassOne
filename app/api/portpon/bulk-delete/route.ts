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
    const ports = await prisma.portPon.findMany({
      where: { id_port: { in: ids } },
      select: { id_port: true, nomor_port: true, tipe_kartu: true, _count: { select: { baa: true } } },
    });

    if (ports.length !== ids.length) {
      return NextResponse.json(
        { success: false, message: "Beberapa Port PON tidak ditemukan." },
        { status: 404 }
      );
    }

    // Check for ports with dependencies (used in BAA)
    const portsWithDeps = ports.filter((p) => p._count.baa > 0);

    if (portsWithDeps.length > 0) {
      const portInfo = portsWithDeps.map((p) => `Port ${p.nomor_port} (${p.tipe_kartu})`).join(", ");
      return NextResponse.json(
        { success: false, message: `${portInfo} tidak dapat dihapus karena masih digunakan di instalasi (BAA).` },
        { status: 400 }
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
