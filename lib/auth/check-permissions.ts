import { permissions } from "@/config/permissions";
import { Role } from "@prisma/client";

// Pakai string literal "ADMIN" langsung, bukan Role.ADMIN
export type PermissionModule = keyof (typeof permissions)["ADMIN"];
export type PermissionAction = "create" | "read" | "update" | "delete";

/**
 * Cek apakah role tertentu punya izin aksi tertentu di modul tertentu.
 * Contoh: checkPermission("SALES", "fab", "create") → true
 */
export function checkPermission(
  role: Role,
  module: PermissionModule,
  action: PermissionAction
): boolean {
  const rolePermissions = permissions[role] as
    | Record<PermissionModule, readonly string[]>
    | undefined;

  if (!rolePermissions) return false;

  const modulePermissions = rolePermissions[module];

  return modulePermissions?.includes(action) ?? false;
}