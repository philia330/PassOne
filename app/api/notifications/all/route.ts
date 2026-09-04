import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLiveNotifications } from "@/lib/notifications"; // path yang bener

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ notifications: [], total: 0, unreadCount: 0 }, { status: 401 });
  }

  const userId = Number(session.user.id_user);
  const role = session.user.role;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));

  try {
    const [persistedTotal, persistedUnread, live] = await Promise.all([
      prisma.notification.count({ where: { id_user: userId } }),
      prisma.notification.count({
        where: { id_user: userId, is_read: false },
      }),
      getLiveNotifications(role, userId),
    ]);

    const total = persistedTotal + live.length;
    const unreadCount = persistedUnread + live.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    type NotifRow = {
      id_notification: number;
      id_user: number;
      title: string;
      message: string;
      link: string | null;
      type: string;
      is_read: boolean;
      createdAt: string;
    };

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const liveCount = live.length;
    const liveSlice = live.slice(startIndex, Math.min(endIndex, liveCount));
    const persistedSkip = Math.max(0, startIndex - liveCount);
    const persistedTake = Math.max(0, endIndex - Math.max(startIndex, liveCount));
    const persisted = persistedTake > 0
      ? await prisma.notification.findMany({
        where: { id_user: userId },
        orderBy: [{ createdAt: "desc" }, { id_notification: "desc" }],
        skip: persistedSkip,
        take: persistedTake,
      })
      : [];

    const persistedRows = persisted.map((n) => ({
        id_notification: n.id_notification,
        id_user: n.id_user,
        title: n.title,
        message: n.message,
        link: n.link,
        type: n.type,
        is_read: n.is_read,
        createdAt: n.createdAt.toISOString(),
      }));
    const notifications = [...liveSlice, ...persistedRows].slice(0, pageSize);

    console.info("[notifications/all] page slice", {
      page,
      pageSize,
      liveCount,
      startIndex,
      endIndex,
      persistedSkip,
      persistedTake,
      returnedIds: notifications.map((item) => item.id_notification),
    });

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    return NextResponse.json({ notifications: [], total: 0, unreadCount: 0 }, { status: 500 });
  }
}