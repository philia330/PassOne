export enum Role {
  ADMIN = "ADMIN",
  LEADER = "LEADER",
  SALES = "SALES",
  TEKNISI = "TEKNISI",
  LOGISTIK = "LOGISTIK",
}

export function normalizeRole(role?: string | null): Role | undefined {
  if (!role) return undefined;

  const normalized = role.trim().toUpperCase();
  return Object.values(Role).includes(normalized as Role)
    ? (normalized as Role)
    : undefined;
}

export const RoleLabel = {
  ADMIN: "Administrator",
  LEADER: "Leader",
  SALES: "Sales",
  TEKNISI: "Teknisi",
  LOGISTIK: "Logistik",
} as const;