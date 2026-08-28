import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLiveNotifications } from "@/lib/notifications"; // path yang bener

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ notifications: [], unreadCount: 0, total: 0 }, { status: 401 });
  }

  const userId = Number(session.user.id_user);
  const role = session.user.role;

  try {
    const [persisted, persistedTotal, persistedUnread, live] = await Promise.all([
      prisma.notification.findMany({
        where: { id_user: userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notification.count({ where: { id_user: userId } }),
      prisma.notification.count({
        where: { id_user: userId, is_read: false },
      }),
      getLiveNotifications(role, userId),
    ]);

    const transformedPersisted = persisted.map((n) => ({
      id_notification: n.id_notification,
      id_user: n.id_user,
      title: n.title,
      message: n.message,
      link: n.link,
      type: n.type,
      is_read: n.is_read,
      createdAt: n.createdAt.toISOString(),
    }));

    // Notifikasi live selalu ditaruh paling atas -- selama kondisinya
    // (FAB open / stok kritis) masih berlaku, dia akan selalu tampil di sini.
    const combined = [...live, ...transformedPersisted].slice(0, 20);
    const unreadCount = persistedUnread + live.length;

    // total = jumlah notifikasi SEBENARNYA (bukan cuma yang diambil untuk
    // preview dropdown), dipakai buat label "Lihat Semua Notifikasi (N)".
    const total = persistedTotal + live.length;

    return NextResponse.json({
      notifications: combined,
      unreadCount,
      total,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ notifications: [], unreadCount: 0, total: 0 }, { status: 500 });
  }
}