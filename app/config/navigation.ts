import { Role } from "@/lib/auth/roles";

import {
  LayoutDashboard,
  MapPinned,
  Network,
  Router,
  Boxes,
  Package,
  PackageOpen,
  FileText,

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
    ],
  },

  {
    title: "Master Data",
    items: [
      {
        title: "Area",
        href: "/masterdata/area",
        icon: MapPinned,
        roles: [Role.ADMIN],
      },
      {
        title: "POP",
        href: "/masterdata/pop",
        icon: Network,
        roles: [Role.ADMIN],
      },
      {
        title: "OLT",
        href: "/masterdata/olt",
        icon: Router,
        roles: [Role.ADMIN],
      },
      {
        title: "ODP",
        href: "/masterdata/odp",
        icon: Boxes,
        roles: [Role.ADMIN, Role.LEADER],
      },
      {
        title: "ONT",
        href: "/masterdata/ont",
        icon: Boxes,
        roles: [Role.ADMIN, Role.LOGISTIK, Role.TEKNISI],
      },
      {
        title: "Port PON",
        href: "/masterdata/port-pon",
        icon: Cable,
        roles: [Role.ADMIN, Role.TEKNISI],
      },
      {
        title: "Material",
        href: "/masterdata/material",
        icon: Package,
        roles: [Role.ADMIN, Role.LOGISTIK, Role.TEKNISI],
      },
      {
        title: "Paket",
        href: "/masterdata/paket",
        icon: PackageOpen,
        roles: [Role.ADMIN, Role.LOGISTIK],
      },
      {
        title: "User",
        href: "/masterdata/user",
        icon: Users,
        roles: [Role.ADMIN],
      },
    ],
  },

  {
    title: "Transaksi",
    items: [
      {
        title: "FAB",
        href: "/jaringan/fab", // ✅ tambah leading slash
        icon: FileText,
        roles: [Role.ADMIN, Role.LEADER, Role.SALES, Role.TEKNISI],
      },
      {
        title: "BAA",
        href: "/jaringan/baa", // ✅ tambah leading slash
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
        href: "/settings",
        icon: Settings,
        roles: [Role.ADMIN],
      },
    ],
  },
];