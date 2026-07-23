// config/navigation.ts

import {
  Boxes,
  ClipboardList,
  FolderKanban,
  Home,
  MapPinned,
  Network,
  Package,
  Router,
  ShieldCheck,
  Users,
} from "lucide-react";

export const navigation = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["ADMIN", "LEADER", "SALES", "TEKNISI", "LOGISTIK"],
  },

  {
    title: "User",
    href: "/dashboard/user",
    icon: Users,
    roles: ["ADMIN"],
  },

  {
    title: "Area",
    href: "/dashboard/area",
    icon: MapPinned,
    roles: ["ADMIN", "LOGISTIK"],
  },

  {
    title: "POP / OLT",
    href: "/dashboard/pop",
    icon: Router,
    roles: ["ADMIN", "TEKNISI"],
  },

  {
    title: "ODP",
    href: "/dashboard/odp",
    icon: Network,
    roles: ["ADMIN", "LEADER"],
  },

  {
    title: "ONT",
    href: "/dashboard/ont",
    icon: ShieldCheck,
    roles: ["ADMIN", "LOGISTIK"],
  },

  {
    title: "Material",
    href: "/dashboard/material",
    icon: Boxes,
    roles: ["ADMIN", "TEKNISI", "LOGISTIK"],
  },

  {
    title: "Paket",
    href: "/dashboard/paket",
    icon: Package,
    roles: ["ADMIN"],
  },

  {
    title: "FAB",
    href: "/dashboard/fab",
    icon: FolderKanban,
    roles: ["ADMIN"],
  },

  {
    title: "BAA",
    href: "/dashboard/baa",
    icon: ClipboardList,
    roles: ["ADMIN", "SALES", "TEKNISI"],
  },
];