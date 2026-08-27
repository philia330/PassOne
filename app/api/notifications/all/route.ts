import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ notifications: [], total: 0, unreadCount: 0 }, { status: 401 });
  }

  const userId = Number(session.user.id_user);
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));

  try {
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
      total,
      unreadCount,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    return NextResponse.json({ notifications: [], total: 0, unreadCount: 0 }, { status: 500 });
  }
}
