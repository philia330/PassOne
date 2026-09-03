import { Role } from "@/lib/auth/roles";

import {
  LayoutDashboard,
  MapPinned,
  Network,
  Map,
  Router,
  Boxes,
  PackageCheck,
  Package,
  PackageOpen,
  FileText,
  FileUp,
  Cable,
  Users,
  Settings,
} from "lucide-react";

export interface NavigationItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

export function normalizeRole(role?: string | null): Role | undefined {
  if (!role) return undefined;
  const normalized = role.trim().toUpperCase();
  return Object.values(Role).includes(normalized as Role)
    ? (normalized as Role)
    : undefined;
}

export function hasAccessToRole(itemRoles: Role[], currentRole?: string | null) {
  const normalizedCurrentRole = normalizeRole(currentRole);
  if (!normalizedCurrentRole) return false;

  return itemRoles.some((role) => normalizeRole(role) === normalizedCurrentRole);
}

export const importExcelOptions = [
  { label: "Area", route: "/api/area/import" },
  { label: "Material", route: "/api/material/import" },
  { label: "OLT", route: "/api/olt/import" },
  { label: "ODP", route: "/api/odp/import" },
  { label: "ONT", route: "/api/ont/import" },
  { label: "Paket", route: "/api/paket/import" },
  { label: "POP", route: "/api/pop/import" },
  { label: "Port PON", route: "/api/port-pon/import" },
  { label: "FAB", route: "/api/fab/import" },
  { label: "BAA", route: "/api/baa/import" },
  { label: "User", route: "/api/user/import" },
] as const;

export const navigation: NavigationGroup[] = [
  {
    title: "Dashboard",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: [
          Role.ADMIN,
          Role.LEADER,
          Role.SALES,
          Role.TEKNISI,
          Role.LOGISTIK,
        ],
      },
      {
        title: "Peta Jaringan",
        href: "/network",
        icon: Map,
        roles: [
          Role.ADMIN,
          Role.LEADER,
          Role.SALES,
          Role.TEKNISI,
          Role.LOGISTIK,
        ],
      },
    ],
  },

  {
    title: "Master Data",
    items: [
      {
        title: "Area",
        href: "/workspace?view=area",
        icon: MapPinned,
        roles: [Role.ADMIN],
      },
      {
        title: "POP",
        href: "/workspace?view=pop",
        icon: Network,
        roles: [Role.ADMIN],
      },
      {
        title: "OLT",
        href: "/workspace?view=olt",
        icon: Router,
        roles: [Role.ADMIN, Role.LEADER],
      },
      {
        title: "ODP",
        href: "/workspace?view=odp",
        icon: Boxes,
        roles: [Role.ADMIN, Role.LEADER],
      },
       {
        title: "ONT",
        href: "/workspace?view=ont",
        icon: PackageCheck,
        roles: [Role.ADMIN, Role.LOGISTIK, Role.TEKNISI],
      },
      {
        title: "Port PON",
        href: "/workspace?view=portpon",
        icon: Cable,
        roles: [Role.ADMIN, Role.TEKNISI],
      },
      {
        title: "Material",
        href: "/workspace?view=material",
        icon: Package,
        roles: [Role.ADMIN, Role.LOGISTIK, Role.TEKNISI],
      },
      {
        title: "Paket",
        href: "/workspace?view=paket",
        icon: PackageOpen,
        roles: [Role.ADMIN, Role.LOGISTIK],
      },
      {
        title: "User",
        href: "/workspace?view=user",
        icon: Users,
        roles: [Role.ADMIN, Role.LEADER],
      },
    ],
  },

  {
    title: "Transaksi",
    items: [
      {
        title: "FAB",
        href: "/workspace?view=fab", // ✅ tambah leading slash
        icon: FileText,
        roles: [Role.ADMIN, Role.LEADER, Role.SALES, Role.TEKNISI],
      },
      {
        title: "BAA",
        href: "/workspace?view=baa", // ✅ tambah leading slash
        icon: FileText,
        roles: [Role.ADMIN, Role.LEADER, Role.TEKNISI, Role.SALES],
      },
    ],
  },

  {
    title: "Pengaturan",
    items: [
      {
        title: "Settings",
        href: "/workspace?view=settings",
        icon: Settings,
        roles: [Role.ADMIN],
      },
      {
        title: "Import Excel",
        href: "#import-excel",
        icon: FileUp,
        roles: [Role.ADMIN],
      },
    ],
  },
];