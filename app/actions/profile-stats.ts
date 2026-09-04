"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeRole, Role } from "@/lib/auth/roles";

export type ProfileStats = {
  user: {
    id_user: number;
    kode_user: string;
    nama: string;
    username: string;
    email: string | null;
    foto: string | null;
    role: Role;
    createdAt: string;
  };
  sales?: {
    totalFab: number;
    openFab: number;
    aktifFab: number;
  };
  teknisi?: {
    referralFab: number;
    baaUtama: number;
    baaTambahan: number;
  };
};

export async function getProfileStats(): Promise<ProfileStats | null> {
  const session = await auth();
  if (!session?.user?.id_user) return null;

  const userId = Number(session.user.id_user);
  const role = normalizeRole(session.user.role);
  if (!role) return null;

  const user = await prisma.user.findUnique({
    where: { id_user: userId },
    select: {
      id_user: true,
      kode_user: true,
      nama: true,
      username: true,
      email: true,
      foto: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  if (role === Role.SALES) {
    const [totalFab, openFab, aktifFab] = await Promise.all([
      prisma.fab.count({ where: { id_user: userId } }),
      prisma.fab.count({ where: { id_user: userId, status: "OPEN" } }),
      prisma.fab.count({ where: { id_user: userId, status: "AKTIF" } }),
    ]);

    return {
      user: { ...user, role, createdAt: user.createdAt.toISOString() },
      sales: { totalFab, openFab, aktifFab },
    };
  }

  if (role === Role.TEKNISI) {
    const [referralFab, baaUtama, baaTambahan] = await Promise.all([
      prisma.fab.count({ where: { id_penginput: userId } }),
      prisma.baa.count({ where: { id_user: userId } }),
      prisma.baateknisi.count({ where: { id_user: userId } }),
    ]);

    return {
      user: { ...user, role, createdAt: user.createdAt.toISOString() },
      teknisi: { referralFab, baaUtama, baaTambahan },
    };
  }

  return {
    user: { ...user, role, createdAt: user.createdAt.toISOString() },
  };
}
