"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
// import { requireRole, requireAuth } from "@/lib/auth/guards"; // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge dari Project Lead
// import { logActivity } from "@/lib/activity-log"; // TODO: aktifkan lagi setelah lib/activity-log.ts & auth.ts di-merge dari Project Lead

const PAGE_SIZE = 10;

const generateKodePop = async (): Promise<string> => {
  const pops = await prisma.pop.findMany({
    select: { kode_pop: true },
    orderBy: { kode_pop: "asc" },
  });

  const numbers = pops
    .map((p) => parseInt(p.kode_pop.split("-")[1], 10))
    .sort((a, b) => a - b);

  let next = 1;
  for (const n of numbers) {
    if (n === next) {
      next++;
    } else {
      break;
    }
  }

  return `POP-${String(next).padStart(3, "0")}`;
};

export const getPops = async (search: string = "", page: number = 1) => {
  // await requireAuth(); // TODO: aktifkan setelah auth.ts di-merge — modul baca data minimal wajib login

  const where = search
    ? {
        OR: [
          { kode_pop: { contains: search } },
          { nama_pop: { contains: search } },
          { alamat: { contains: search } },
          { area: { nama_area: { contains: search } } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.pop.findMany({
      where,
      include: { area: true },
      orderBy: { kode_pop: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.pop.count({ where }),
  ]);

  return {
    data,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
};

export const getAreas = async () => {
  // await requireAuth(); // TODO: aktifkan setelah auth.ts di-merge

  return prisma.area.findMany({
    select: { id_area: true, nama_area: true },
    orderBy: { nama_area: "asc" },
  });
};

export const createPop = async (formData: FormData) => {
  // await requireRole(["ADMIN"]); // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge

  const kode_pop = await generateKodePop();
  const nama_pop = formData.get("nama_pop") as string;
  const alamat = formData.get("alamat") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);
  const id_area = parseInt(formData.get("id_area") as string, 10);

  const pop = await prisma.pop.create({
    data: { kode_pop, nama_pop, alamat, latitude, longitude, id_area },
  });

  // await logActivity("POP_CREATED", `POP ${pop.nama_pop} dibuat.`);

  revalidatePath("/masterdata/pop");
};

export const updatePop = async (id: number, formData: FormData) => {
  // await requireRole(["ADMIN"]); // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge

  const nama_pop = formData.get("nama_pop") as string;
  const alamat = formData.get("alamat") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);
  const id_area = parseInt(formData.get("id_area") as string, 10);

  const pop = await prisma.pop.update({
    where: { id_pop: id },
    data: { nama_pop, alamat, latitude, longitude, id_area },
  });

  // await logActivity("POP_UPDATED", `POP ${pop.nama_pop} diperbarui.`);

  revalidatePath("/masterdata/pop");
};

export const deletePop = async (id: number) => {
  // await requireRole(["ADMIN"]); // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge

  const pop = await prisma.pop.delete({ where: { id_pop: id } });

  // await logActivity("POP_DELETED", `POP ${pop.nama_pop} dihapus.`);

  revalidatePath("/masterdata/pop");
};