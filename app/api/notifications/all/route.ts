import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLiveNotifications } from "@/lib/notifications";

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
  // Filter urutan: "desc" (terbaru dulu, default) atau "asc" (terlama dulu).
  const sortParam = searchParams.get("sort") === "asc" ? "asc" : "desc";

  try {
    const [persistedAll, persistedUnread, live] = await Promise.all([
      // Live dan persisted digabung lalu diurutkan bareng berdasarkan
      // createdAt -- jadi urutan finalnya dihitung di memori, makanya di
      // sini ambil SEMUA notifikasi persisted milik user (bukan langsung
      // dipaginasi lewat skip/take di query), supaya urutan gabungan akurat
      // sebelum dipotong sesuai halaman yang diminta.
      prisma.notification.findMany({
        where: { id_user: userId },
        orderBy: [{ createdAt: "desc" }, { id_notification: "desc" }],
      }),
      prisma.notification.count({
        where: { id_user: userId, is_read: false },
      }),
      getLiveNotifications(role, userId),
    ]);

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

    const persistedRows: NotifRow[] = persistedAll.map((n) => ({
      id_notification: n.id_notification,
      id_user: n.id_user,
      title: n.title,
      message: n.message,
      link: n.link,
      type: n.type,
      is_read: n.is_read,
      createdAt: n.createdAt.toISOString(),
    }));

    const combined: NotifRow[] = [...live, ...persistedRows].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortParam === "asc" ? diff : -diff;
    });

    const total = combined.length;
    const unreadCount = persistedUnread + live.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const startIndex = (page - 1) * pageSize;
    const notifications = combined.slice(startIndex, startIndex + pageSize);

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