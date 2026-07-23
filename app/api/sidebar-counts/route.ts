import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({}, { status: 401 });
  }

  const [area, pop, olt, odp, ont, material, paket, user, fab, baa] =
    await Promise.all([
      prisma.area.count(),
      prisma.pop.count(),
      prisma.olt.count(),
      prisma.odp.count(),
      prisma.ont.count(),
      prisma.material.count(),
      prisma.paket.count(),
      prisma.user.count(),
      prisma.fab.count(),
      prisma.baa.count(),
    ]);

  const counts: Record<string, number> = {
    "/masterdata/area": area,
    "/masterdata/pop": pop,
    "/masterdata/olt": olt,
    "/masterdata/odp": odp,
    "/masterdata/ont": ont,
    "/masterdata/material": material,
    "/masterdata/paket": paket,
    "/masterdata/user": user,
    "/fab": fab,
    "/baa": baa,
  };

  return NextResponse.json(counts);
}