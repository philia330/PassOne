import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";

/**
 * Response jika user belum login
 */
export function unauthorized(message = "Silakan login terlebih dahulu") {
  return NextResponse.json(
    { success: false, message },
    { status: 401 }
  );
}

/**
 * Response jika user tidak punya akses (role tidak sesuai)
 */
export function forbidden(message = "Anda tidak memiliki akses untuk fitur ini") {
  return NextResponse.json(
    { success: false, message },
    { status: 403 }
  );
}

/**
 * Cek apakah user sudah login. Jika belum, return response 401.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { authorized: false, response: unauthorized() };
  }
  return { authorized: true, session };
}

/**
 * Cek apakah user punya role tertentu.
 * Jika belum login, return 401.
 * Jika role tidak sesuai, return 403.
 */
export async function requireRole(...allowedRoles: Role[]) {
  const session = await auth();

  if (!session?.user) {
    return { authorized: false, response: unauthorized() };
  }

  const userRole = session.user.role as Role;

  if (!allowedRoles.includes(userRole)) {
    const roleNames = allowedRoles.join(", ");
    return {
      authorized: false,
      response: forbidden(`Akses ditolak. Fitur ini hanya untuk: ${roleNames}`)
    };
  }

  return { authorized: true, session };
}

/**
 * Cek apakah user adalah ADMIN.
 */
export async function requireAdmin() {
  return requireRole(Role.ADMIN);
}

/**
 * Cek apakah user adalah ADMIN atau LEADER.
 */
export async function requireAdminOrLeader() {
  return requireRole(Role.ADMIN, Role.LEADER);
}

/**
 * Cek apakah user adalah ADMIN atau TEKNISI.
 */
export async function requireAdminOrTeknisi() {
  return requireRole(Role.ADMIN, Role.TEKNISI);
}

/**
 * Cek apakah user adalah ADMIN atau LOGISTIK.
 */
export async function requireAdminOrLogistik() {
  return requireRole(Role.ADMIN, Role.LOGISTIK);
}
