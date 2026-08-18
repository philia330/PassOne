import { prisma } from "@/lib/prisma";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];
export async function getMonthlyTrend(monthsCount = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - (monthsCount - 1));
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const [fabs, baas] = await Promise.all([
    prisma.fab.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, status: true },
    }),
    prisma.baa.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    }),
  ]);

  const buckets: { key: string; label: string; fabOpen: number; fabAktif: number; baa: number }[] = [];
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    buckets.push({ key, label: MONTH_LABELS[d.getMonth()], fabOpen: 0, fabAktif: 0, baa: 0 });
  }

  const bucketMap = new Map(buckets.map((b) => [b.key, b]));

  fabs.forEach((f) => {
    const key = `${f.createdAt.getFullYear()}-${f.createdAt.getMonth()}`;
    const bucket = bucketMap.get(key);
    if (!bucket) return;
    if (f.status === "AKTIF") {
      bucket.fabAktif += 1;
    } else {
      bucket.fabOpen += 1;
    }
  });

  baas.forEach((b) => {
    const key = `${b.createdAt.getFullYear()}-${b.createdAt.getMonth()}`;
    const bucket = bucketMap.get(key);
    if (bucket) bucket.baa += 1;
  });

  return buckets.map(({ label, fabOpen, fabAktif, baa }) => ({ label, fabOpen, fabAktif, baa }));
}

// Tambahan baru — buat perbandingan periode
export async function getPeriodComparison(monthsCount = 6) {
  const now = new Date();

  const currentStart = new Date();
  currentStart.setMonth(currentStart.getMonth() - monthsCount);
  currentStart.setHours(0, 0, 0, 0);

  const previousStart = new Date();
  previousStart.setMonth(previousStart.getMonth() - monthsCount * 2);
  previousStart.setHours(0, 0, 0, 0);

  const [currentFab, currentBaa, previousFab, previousBaa] = await Promise.all([
    prisma.fab.count({ where: { createdAt: { gte: currentStart, lte: now } } }),
    prisma.baa.count({ where: { createdAt: { gte: currentStart, lte: now } } }),
    prisma.fab.count({ where: { createdAt: { gte: previousStart, lt: currentStart } } }),
    prisma.baa.count({ where: { createdAt: { gte: previousStart, lt: currentStart } } }),
  ]);

  function calcChange(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  return {
    fab: { current: currentFab, previous: previousFab, changePercent: calcChange(currentFab, previousFab) },
    baa: { current: currentBaa, previous: previousBaa, changePercent: calcChange(currentBaa, previousBaa) },
  };
}

export async function getStatusBreakdown() {
  const [fabStatus, baaStatus] = await Promise.all([
    prisma.fab.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.baa.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  return {
    fab: fabStatus.map((s) => ({ name: s.status, value: s._count.status })),
    baa: baaStatus.map((s) => ({ name: s.status, value: s._count.status })),
  };
}

export async function getSlaAlerts() {
  const fabOpen = await prisma.fab.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "asc" },
    take: 10,
    select: {
      id_fab: true,
      kode_fab: true,
      nama_pelanggan: true,
      createdAt: true,
    },
  });

  // BAA tidak lagi punya status "pending" -- begitu dibuat langsung Selesai,
  // jadi tidak ada lagi yang perlu dipantau di sini.
  return { fabOpen, baaOpen: [] as never[] };
}