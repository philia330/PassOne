import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [
      fabCount,
      baaCount,
      areaCount,
      popCount,
      oltCount,
      odpCount,
      ontCount,
      portPonCount,
      materialCount,
      paketCount,
      userCount,
    ] = await Promise.all([
      prisma.fab.count(),
      prisma.baa.count(),
      prisma.area.count(),
      prisma.pop.count(),
      prisma.olt.count(),
      prisma.odp.count(),
      prisma.ont.count(),
      prisma.portPon.count(),
      prisma.material.count(),
      prisma.paket.count(),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      "/workspace?view=fab": fabCount,
      "/workspace?view=baa": baaCount,
      "/workspace?view=area": areaCount,
      "/workspace?view=pop": popCount,
      "/workspace?view=olt": oltCount,
      "/workspace?view=odp": odpCount,
      "/workspace?view=ont": ontCount,
      "/workspace?view=portpon": portPonCount,
      "/workspace?view=material": materialCount,
      "/workspace?view=paket": paketCount,
      "/workspace?view=user": userCount,
    });
  } catch (error) {
    console.error("Error fetching sidebar counts:", error);
    return NextResponse.json({}, { status: 500 });
  }
}
