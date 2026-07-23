import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getMonthlyTrend } from "@/lib/dashboard-stats";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({}, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const months = Number(searchParams.get("months") ?? 6);

  const monthly = await getMonthlyTrend(months);

  return NextResponse.json({ monthly });
}