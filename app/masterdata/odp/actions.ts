"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
// import { requireRole, requireAuth } from "@/lib/auth/guards"; // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge dari Project Lead
// import { logActivity } from "@/lib/activity-log"; // TODO: aktifkan lagi setelah lib/activity-log.ts & auth.ts di-merge dari Project Lead

const PAGE_SIZE = 10;

// ======================================================
// Generate kode ODP otomatis
// Format:
// ODP-001
// ODP-002
// ODP-003
// ======================================================

const generateKodeOdp = async (): Promise<string> => {
  const odps = await prisma.odp.findMany({
    select: {
      kode_odp: true,
    },
    orderBy: {
      kode_odp: "asc",
    },
  });

  const numbers = odps
    .map((o) => parseInt(o.kode_odp.split("-")[1], 10))
    .sort((a, b) => a - b);

  let next = 1;

  for (const n of numbers) {
    if (n === next) {
      next++;
    } else {
      break;
    }
  }

  return `ODP-${String(next).padStart(3, "0")}`;
};

// ======================================================
// Ambil data ODP
// Search + Pagination
// ======================================================

export const getOdps = async (
  search: string = "",
  page: number = 1
) => {
  // await requireAuth(); // TODO: aktifkan setelah auth.ts di-merge — modul baca data minimal wajib login

  const where = search
    ? {
        OR: [
          {
            kode_odp: {
              contains: search,
            },
          },
          {
            nama_odp: {
              contains: search,
            },
          },
          {
            alamat: {
              contains: search,
            },
          },
          {
            olt: {
              nama_olt: {
                contains: search,
              },
            },
          },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.odp.findMany({
      where,
      include: {
        olt: true,
      },
      orderBy: {
        kode_odp: "asc",
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),

    prisma.odp.count({
      where,
    }),
  ]);

  return {
    data,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
};

// ======================================================
// Ambil daftar OLT
// Untuk dropdown Select
// ======================================================

export const getOlts = async () => {
  // await requireAuth(); // TODO: aktifkan setelah auth.ts di-merge

  return prisma.olt.findMany({
    select: {
      id_olt: true,
      nama_olt: true,
    },
    orderBy: {
      nama_olt: "asc",
    },
  });
};

// ======================================================
// Tambah ODP
// ======================================================

export const createOdp = async (formData: FormData) => {
  // await requireRole(["ADMIN"]); // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge

  const kode_odp = await generateKodeOdp();

  const nama_odp = formData.get("nama_odp") as string;
  const alamat = formData.get("alamat") as string;

  const latitude = parseFloat(
    formData.get("latitude") as string
  );

  const longitude = parseFloat(
    formData.get("longitude") as string
  );

  const id_olt = parseInt(
    formData.get("id_olt") as string,
    10
  );

  const jumlahPortRaw = formData.get("jumlah_port") as string;
  const stokPortRaw = formData.get("stok_port") as string;

  const jumlah_port = jumlahPortRaw ? parseInt(jumlahPortRaw, 10) : null;
  const stok_port = stokPortRaw ? parseInt(stokPortRaw, 10) : 0;

  const odp = await prisma.odp.create({
    data: {
      kode_odp,
      nama_odp,
      alamat,
      latitude,
      longitude,
      id_olt,
      jumlah_port,
      stok_port,
    },
  });

  // await logActivity("ODP_CREATED", `ODP ${odp.nama_odp} dibuat.`);

  revalidatePath("/masterdata/odp");
};

// ======================================================
// Update ODP
// ======================================================

export const updateOdp = async (
  id: number,
  formData: FormData
) => {
  // await requireRole(["ADMIN"]); // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge

  const nama_odp = formData.get("nama_odp") as string;
  const alamat = formData.get("alamat") as string;

  const latitude = parseFloat(
    formData.get("latitude") as string
  );

  const longitude = parseFloat(
    formData.get("longitude") as string
  );

  const id_olt = parseInt(
    formData.get("id_olt") as string,
    10
  );

  const jumlahPortRaw = formData.get("jumlah_port") as string;
  const stokPortRaw = formData.get("stok_port") as string;

  const jumlah_port = jumlahPortRaw ? parseInt(jumlahPortRaw, 10) : null;
  const stok_port = stokPortRaw ? parseInt(stokPortRaw, 10) : 0;

  const odp = await prisma.odp.update({
    where: {
      id_odp: id,
    },
    data: {
      nama_odp,
      alamat,
      latitude,
      longitude,
      id_olt,
      jumlah_port,
      stok_port,
    },
  });

  // await logActivity("ODP_UPDATED", `ODP ${odp.nama_odp} diperbarui.`);

  revalidatePath("/masterdata/odp");
};

// ======================================================
// Hapus ODP
// ======================================================

export const deleteOdp = async (id: number) => {
  // await requireRole(["ADMIN"]); // TODO: aktifkan setelah lib/auth/guards.ts & auth.ts di-merge

  const odp = await prisma.odp.delete({
    where: {
      id_odp: id,
    },
  });

  // await logActivity("ODP_DELETED", `ODP ${odp.nama_odp} dihapus.`);

  revalidatePath("/masterdata/odp");
};