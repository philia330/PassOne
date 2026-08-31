import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id_user);

  try {
    const body = await request.json();
    const { idNotification } = body;

    if (!idNotification) {
      return NextResponse.json({ error: "ID notifikasi diperlukan" }, { status: 400 });
    }

    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id_notification: idNotification },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notifikasi tidak ditemukan" }, { status: 404 });
    }

    if (notification.id_user !== userId) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    // Mark as read
    await prisma.notification.update({
      where: { id_notification: idNotification },
      data: { is_read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
