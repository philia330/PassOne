import { MapPin, Box, Router, Boxes, Cable, PackageOpen, Users, ClipboardList, FileCheck2, Settings, Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type WorkspaceModuleKey = "area" | "material" | "pop" | "olt" | "odp" | "ont" | "portpon" | "paket" | "user" | "fab" | "baa" | "settings" | "notifications";

export type WorkspaceModuleConfig = {
  key: WorkspaceModuleKey;
  title: string;
  icon: LucideIcon;
  usesSearchParams: boolean;
};

export const WORKSPACE_MODULES: WorkspaceModuleConfig[] = [
  { key: "area", title: "Area", icon: MapPin, usesSearchParams: true },
  { key: "material", title: "Material", icon: Box, usesSearchParams: false },
  { key: "pop", title: "POP", icon: Router, usesSearchParams: true },
  { key: "olt", title: "OLT", icon: Router, usesSearchParams: true },
  { key: "odp", title: "ODP", icon: Boxes, usesSearchParams: true },
  { key: "ont", title: "ONT", icon: Boxes, usesSearchParams: true },
  { key: "portpon", title: "Port PON", icon: Cable, usesSearchParams: true },
  { key: "paket", title: "Paket", icon: PackageOpen, usesSearchParams: false },
  { key: "user", title: "User", icon: Users, usesSearchParams: true },
  { key: "fab", title: "FAB", icon: ClipboardList, usesSearchParams: false },
  { key: "baa", title: "BAA", icon: FileCheck2, usesSearchParams: false },
  { key: "settings", title: "Settings", icon: Settings, usesSearchParams: false },
  { key: "notifications", title: "Notifikasi", icon: Bell, usesSearchParams: false },
];

export const DEFAULT_MODULE: WorkspaceModuleKey = "area";