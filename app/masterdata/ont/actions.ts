"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { StatusOnt } from "@prisma/client";
// import { requireRole, requireAuth } from "@/lib/auth/guards"; // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge dari Project Lead
// import { logActivity } from "@/lib/activity-log"; // TODO: aktifkan lagi setelah lib/activity-log.ts & auth.ts di-merge dari Project Lead

const PAGE_SIZE = 10;

// ======================================================
// Ambil data ONT dengan search & pagination
// ======================================================
export const getOnts = async (search: string = "", page: number = 1) => {
  // await requireAuth(); // TODO: aktifkan setelah auth.ts di-merge — modul baca data minimal wajib login

  const where = search
    ? {
        OR: [
          { serial_number: { contains: search } },
          { pelanggan: { contains: search } },
          { pop: { nama_pop: { contains: search } } },
          { odp: { nama_odp: { contains: search } } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.ont.findMany({
      where,
      include: { pop: true, odp: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.ont.count({ where }),
  ]);

  return {
    data,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
};

// ======================================================
// Dropdown POP & ODP (select agar tidak bawa field Decimal)
// ======================================================
export const getPops = async () => {
  // await requireAuth(); // TODO: aktifkan setelah auth.ts di-merge

  return prisma.pop.findMany({
    select: { id_pop: true, nama_pop: true },
    orderBy: { nama_pop: "asc" },
  });
};

export const getOdps = async () => {
  // await requireAuth(); // TODO: aktifkan setelah auth.ts di-merge

  return prisma.odp.findMany({
    select: { id_odp: true, nama_odp: true },
    orderBy: { nama_odp: "asc" },
  });
};

// ======================================================
// Tambah ONT
// ======================================================
export const createOnt = async (formData: FormData) => {
  // await requireRole(["ADMIN", "LOGISTIK"]); // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge

  const serial_number = formData.get("serial_number") as string;
  const pelanggan = formData.get("pelanggan") as string;
  const status = formData.get("status") as StatusOnt;
  const id_pop = parseInt(formData.get("id_pop") as string, 10);
  const id_odp = parseInt(formData.get("id_odp") as string, 10);

  const ont = await prisma.ont.create({
    data: { serial_number, pelanggan, status, id_pop, id_odp },
  });

  // await logActivity("ONT_CREATED", `ONT ${ont.serial_number} dibuat.`);

  revalidatePath("/masterdata/ont");
};

// ======================================================
// Update ONT
// ======================================================
export const updateOnt = async (id: number, formData: FormData) => {
  // await requireRole(["ADMIN", "LOGISTIK"]); // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge

  const serial_number = formData.get("serial_number") as string;
  const pelanggan = formData.get("pelanggan") as string;
  const status = formData.get("status") as StatusOnt;
  const id_pop = parseInt(formData.get("id_pop") as string, 10);
  const id_odp = parseInt(formData.get("id_odp") as string, 10);

  const ont = await prisma.ont.update({
    where: { id_ont: id },
    data: { serial_number, pelanggan, status, id_pop, id_odp },
  });

  // await logActivity("ONT_UPDATED", `ONT ${ont.serial_number} diperbarui.`);

  revalidatePath("/masterdata/ont");
};

// ======================================================
// Hapus ONT
// ======================================================
export const deleteOnt = async (id: number) => {
  // await requireRole(["ADMIN", "LOGISTIK"]); // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge

  const ont = await prisma.ont.delete({ where: { id_ont: id } });

  // await logActivity("ONT_DELETED", `ONT ${ont.serial_number} dihapus.`);

  revalidatePath("/masterdata/ont");
};