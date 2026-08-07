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

  // ADMIN: melihat semua notifikasi
  // SALES: hanya notifikasi FAB
  // LOGISTIK: hanya notifikasi material
  // LEADER/TEKNISI: FAB + material

  const isAdmin = role === "ADMIN";
  const canSeeMaterial = isAdmin || role === "LOGISTIK" || role === "LEADER" || role === "TEKNISI";
  const canSeeFab = isAdmin || role === "SALES" || role === "LEADER" || role === "TEKNISI";

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
          href: "/workspace?view=material",
          severity: m.stok === 0 ? "danger" : "warning",
        });
      });
  }

  if (canSeeFab) {
    const fabPending = await prisma.fab.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "asc" },
      // Hapus take(5) - tampilkan semua FAB pending
      select: { id_fab: true, kode_fab: true, nama_pelanggan: true, createdAt: true },
    });

    fabPending.forEach((f) => {
      notifications.push({
        id: `fab-${f.id_fab}`,
        title: "FAB Menunggu Tindak Lanjut",
        description: `${f.kode_fab} — ${f.nama_pelanggan} masih berstatus Open.`,
        href: "/workspace?view=fab",
        severity: "info",
      });
    });
  }

  // Admin juga melihat statistik keseluruhan
  if (isAdmin) {
    const fabOpenCount = await prisma.fab.count({ where: { status: "OPEN" } });

    // Tambahkan notifikasi ringkasan jika banyak
    if (fabOpenCount > 10) {
      notifications.push({
        id: "fab-summary",
        title: "Banyak FAB Pending",
        description: `Ada ${fabOpenCount} FAB yang masih berstatus Open dan perlu ditindaklanjuti.`,
        href: "/workspace?view=fab",
        severity: "warning",
      });
    }
  }

  return notifications;
}