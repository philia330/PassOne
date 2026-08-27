import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 401 });
  }

  const userId = Number(session.user.id_user);

  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { id_user: userId },
        orderBy: { createdAt: "desc" },
        take: 20, // Ambil 20 terbaru untuk dropdown
      }),
      prisma.notification.count({
        where: { id_user: userId, is_read: false },
      }),
    ]);

    // Transform ke format yang diharapkan client
    const transformedNotifications = notifications.map((n) => ({
      id_notification: n.id_notification,
      id_user: n.id_user,
      title: n.title,
      message: n.message,
      link: n.link,
      type: n.type,
      is_read: n.is_read,
      createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json({
      notifications: transformedNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 500 });
  }
}
