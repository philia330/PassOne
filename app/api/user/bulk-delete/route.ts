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
    // VALIDATION: Check if any ID is the current user
    // ======================================
    const currentUserId = authResult.session.user.id_user;
    if (ids.includes(currentUserId)) {
      return NextResponse.json(
        { success: false, message: "Tidak dapat menghapus akun sendiri." },
        { status: 400 }
      );
    }

    // ======================================
    // CHECK DEPENDENCIES
    // ======================================
    const users = await prisma.user.findMany({
      where: { id_user: { in: ids } },
      select: { id_user: true, nama: true, _count: { select: { fabSales: true, fabPenginput: true, baa: true, baaTeknisi: true } } },
    });

    if (users.length !== ids.length) {
      return NextResponse.json(
        { success: false, message: "Beberapa user tidak ditemukan." },
        { status: 404 }
      );
    }

    // Check for users with dependencies
    const usersWithDeps = users.filter(
      (u) => u._count.fabSales > 0 || u._count.fabPenginput > 0 || u._count.baa > 0 || u._count.baaTeknisi > 0
    );

    if (usersWithDeps.length > 0) {
      const names = usersWithDeps.map((u) => u.nama).join(", ");
      return NextResponse.json(
        { success: false, message: `User "${names}" tidak dapat dihapus karena masih memiliki data terkait.` },
        { status: 400 }
      );
    }

    // ======================================
    // DELETE
    // ======================================
    await prisma.user.deleteMany({
      where: { id_user: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${ids.length} user.`,
    });

  } catch (error) {
    return handleApiError(error, "USER_BULK_DELETE");
  }
}
