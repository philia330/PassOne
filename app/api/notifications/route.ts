import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getNotifications } from "@/lib/notifications";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ notifications: [] }, { status: 401 });
  }

  const notifications = await getNotifications(session.user.role);

  return NextResponse.json({ notifications });
}