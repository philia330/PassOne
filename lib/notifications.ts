import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  severity: "warning" | "danger" | "info";
};

export async function getNotifications(role: Role): Promise<NotificationItem[]> {
  const notifications: NotificationItem[] = [];

  const canSeeMaterial = role === "ADMIN" || role === "LOGISTIK";
  const canSeeFab = role === "ADMIN" || role === "SALES" || role === "LEADER";
  const canSeeBaa = role === "ADMIN" || role === "TEKNISI" || role === "LEADER";

  if (canSeeMaterial) {
    const materials = await prisma.material.findMany({
      select: { id_material: true, nama_material: true, stok: true, minimal_stok: true },
    });

    materials
      .filter((m) => m.stok <= m.minimal_stok)
      .forEach((m) => {
        notifications.push({
          id: `material-${m.id_material}`,
          title: "Stok Material Menipis",
          description: `${m.nama_material} tersisa ${m.stok} unit (minimal ${m.minimal_stok}).`,
          href: "/masterdata/material",
          severity: m.stok === 0 ? "danger" : "warning",
        });
      });
  }

  if (canSeeFab) {
    const fabPending = await prisma.fab.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: { id_fab: true, kode_fab: true, nama_pelanggan: true, createdAt: true },
    });

    fabPending.forEach((f) => {
      notifications.push({
        id: `fab-${f.id_fab}`,
        title: "FAB Menunggu Tindak Lanjut",
        description: `${f.kode_fab} — ${f.nama_pelanggan} masih berstatus Pending.`,
        href: "/fab",
        severity: "info",
      });
    });
  }

  if (canSeeBaa) {
    const baaPending = await prisma.baa.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: { id_baa: true, kode_baa: true, createdAt: true },
    });

    baaPending.forEach((b) => {
      notifications.push({
        id: `baa-${b.id_baa}`,
        title: "BAA Menunggu Tindak Lanjut",
        description: `${b.kode_baa} masih berstatus Pending.`,
        href: "/baa",
        severity: "info",
      });
    });
  }

  return notifications;
}