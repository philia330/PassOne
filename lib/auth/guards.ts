import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { checkPermission, PermissionModule, PermissionAction } from "./check-permissions";

export class UnauthorizedError extends Error {
  constructor(message = "Anda tidak memiliki akses untuk melakukan aksi ini.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    throw new UnauthorizedError("Anda harus login untuk melakukan aksi ini.");
  }

  return session;
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.user.role)) {
    throw new UnauthorizedError(
      `Aksi ini hanya bisa dilakukan oleh: ${allowedRoles.join(", ")}.`
    );
  }

  return session;
}

/**
 * Proteksi berbasis permission granular (create/read/update/delete per modul),
 * bukan cuma role secara umum. Cocok buat aksi yang aturannya beda-beda per modul,
 * misal LEADER boleh baca FAB tapi nggak boleh bikin baru.
 */
export async function requirePermission(module: PermissionModule, action: PermissionAction) {
  const session = await requireAuth();

  const allowed = checkPermission(session.user.role, module, action);

  if (!allowed) {
    throw new UnauthorizedError(
      `Role ${session.user.role} tidak punya izin "${action}" di modul "${module}".`
    );
  }

  return session;
}

export async function requirePageAccess(allowedRoles: Role[]) {
  const session = await auth();

  if (!session?.user || !allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  return session;
}