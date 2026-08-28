import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export type LiveNotification = {
  id_notification: number;
  id_user: number;
  title: string;
  message: string;
  link: string | null;
  type: string;
  is_read: boolean;
  createdAt: string;
};

const FAB_ID_OFFSET = 1_000_000_000;
const MATERIAL_ID_OFFSET = 2_000_000_000;

export async function getLiveNotifications(role: Role, userId: number): Promise<LiveNotification[]> {
  const result: LiveNotification[] = [];

  const isAdmin = role === "ADMIN";
  const canSeeMaterial = isAdmin || role === "LOGISTIK" || role === "LEADER";
  const canSeeFab = isAdmin || role === "SALES" || role === "LEADER";

  if (canSeeFab) {
    const fabOpen = await prisma.fab.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "asc" },
      select: { id_fab: true, kode_fab: true, nama_pelanggan: true, createdAt: true },
    });

    fabOpen.forEach((f) => {
      result.push({
        id_notification: -(FAB_ID_OFFSET + f.id_fab),
        id_user: userId,
        title: "FAB Menunggu Tindak Lanjut",
        message: `${f.kode_fab} — ${f.nama_pelanggan} masih berstatus Open, belum ditugaskan ke teknisi.`,
        link: `/jaringan/fab?highlight=${f.id_fab}`,
        type: "FAB_OPEN",
        is_read: false,
        createdAt: f.createdAt.toISOString(),
      });
    });
  }

  if (canSeeMaterial) {
    const materials = await prisma.material.findMany({
      select: { id_material: true, nama_material: true, stok: true, minimal_stok: true, satuan: true },
    });

    materials
      .filter((m) => m.stok <= m.minimal_stok)
      .forEach((m) => {
        result.push({
          id_notification: -(MATERIAL_ID_OFFSET + m.id_material),
          id_user: userId,
          title: "Stok Material Menipis",
          message: `${m.nama_material} tersisa ${m.stok} ${m.satuan} (minimal: ${m.minimal_stok}).`,
          link: `/masterdata/material`,
          type: "SYSTEM",
          is_read: false,
          createdAt: new Date().toISOString(),
        });
      });
  }

  return result;
}