"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// ============================================
// TYPES
// ============================================

export type NotificationData = {
  id_notification: number;
  id_user: number;
  title: string;
  message: string;
  link: string | null;
  type: string;
  is_read: boolean;
  createdAt: Date;
};

// ============================================
// CREATE NOTIFICATION
// ============================================

/**
 * Buat notifikasi untuk user tertentu
 */
export async function createNotification({
  idUser,
  title,
  message,
  link,
  type = "SYSTEM",
}: {
  idUser: number;
  title: string;
  message: string;
  link?: string;
  type?: "FAB_ASSIGNED" | "FAB_STATUS_CHANGE" | "BAA_CREATED" | "SYSTEM";
}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid.");
  }

  try {
    const notification = await prisma.notification.create({
      data: {
        id_user: idUser,
        title,
        message,
        link: link ?? null,
        type: type as any,
        is_read: false,
      },
    });

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw new Error("Gagal membuat notifikasi.");
  }
}

/**
 * Buat beberapa notifikasi sekaligus (untuk bulk assignment)
 */
export async function createBulkNotifications({
  notifications,
}: {
  notifications: Array<{
    idUser: number;
    title: string;
    message: string;
    link?: string;
    type?: "FAB_ASSIGNED" | "FAB_STATUS_CHANGE" | "BAA_CREATED" | "SYSTEM";
  }>;
}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid.");
  }

  try {
    const result = await prisma.notification.createMany({
      data: notifications.map((n) => ({
        id_user: n.idUser,
        title: n.title,
        message: n.message,
        link: n.link ?? null,
        type: (n.type ?? "SYSTEM") as any,
        is_read: false,
      })),
    });

    return result;
  } catch (error) {
    console.error("Failed to create bulk notifications:", error);
    throw new Error("Gagal membuat notifikasi.");
  }
}

// ============================================
// GET NOTIFICATIONS
// ============================================

/**
 * Ambil notifikasi untuk user yang sedang login
 */
export async function getMyNotifications({
  page = 1,
  pageSize = 10,
}: {
  page?: number;
  pageSize?: number;
} = {}) {
  const session = await auth();
  if (!session?.user) {
    return { notifications: [], total: 0, unreadCount: 0 };
  }

  const userId = Number(session.user.id_user);

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { id_user: userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where: { id_user: userId } }),
    prisma.notification.count({
      where: { id_user: userId, is_read: false },
    }),
  ]);

  return { notifications, total, unreadCount, page, pageSize };
}

/**
 * Ambil beberapa notifikasi terbaru untuk dropdown (FEATURE A)
 */
export async function getLatestNotifications(limit = 5) {
  const session = await auth();
  if (!session?.user) {
    return { notifications: [], unreadCount: 0 };
  }

  const userId = Number(session.user.id_user);

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { id_user: userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({
      where: { id_user: userId, is_read: false },
    }),
  ]);

  return { notifications, unreadCount };
}

// ============================================
// UPDATE NOTIFICATIONS
// ============================================

/**
 * Tandai satu notifikasi sebagai sudah dibaca
 */
export async function markNotificationAsRead(idNotification: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid.");
  }

  const userId = Number(session.user.id_user);

  try {
    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id_notification: idNotification },
    });

    if (!notification) {
      throw new Error("Notifikasi tidak ditemukan.");
    }

    if (notification.id_user !== userId) {
      throw new Error("Anda tidak memiliki akses ke notifikasi ini.");
    }

    await prisma.notification.update({
      where: { id_notification: idNotification },
      data: { is_read: true },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw error;
    }
    throw error;
  }
}

/**
 * Tandai semua notifikasi user sebagai sudah dibaca
 */
export async function markAllNotificationsAsRead() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid.");
  }

  const userId = Number(session.user.id_user);

  try {
    await prisma.notification.updateMany({
      where: { id_user: userId, is_read: false },
      data: { is_read: true },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    throw new Error("Gagal menandai semua notifikasi sebagai dibaca.");
  }
}

// ============================================
// DELETE NOTIFICATIONS
// ============================================

/**
 * Hapus notifikasi (opsional, untuk cleanup)
 */
export async function deleteNotification(idNotification: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid.");
  }

  const userId = Number(session.user.id_user);

  try {
    const notification = await prisma.notification.findUnique({
      where: { id_notification: idNotification },
    });

    if (!notification) {
      throw new Error("Notifikasi tidak ditemukan.");
    }

    if (notification.id_user !== userId) {
      throw new Error("Anda tidak memiliki akses ke notifikasi ini.");
    }

    await prisma.notification.delete({
      where: { id_notification: idNotification },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw error;
    }
    throw error;
  }
}

// ============================================
// TEKNISI OPTIONS
// ============================================

/**
 * Ambil daftar teknisi untuk dropdown assignment
 */
export async function getTeknisiOptions() {
  const session = await auth();
  if (!session?.user) {
    return [];
  }

  const teknisiList = await prisma.user.findMany({
    where: {
      role: "TEKNISI",
      status: true,
    },
    select: {
      id_user: true,
      nama: true,
      username: true,
    },
    orderBy: { nama: "asc" },
  });

  return teknisiList;
}
