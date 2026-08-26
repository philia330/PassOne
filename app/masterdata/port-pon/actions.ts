"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { portpon_status } from "@prisma/client";
import { z } from "zod";

const PAGE_SIZE = 10;

// ======================================================
// VALIDATION SCHEMA - Port PON
// ======================================================

const portPonValidation = z.object({
  nomor_port: z
    .number()
    .int("Nomor port harus berupa angka bulat.")
    .min(1, "Nomor port minimal 1.")
    .max(256, "Nomor port maksimal 256."),
  tipe_kartu: z
    .string()
    .min(1, "Tipe kartu wajib diisi.")
    .max(50, "Tipe kartu maksimal 50 karakter."),
  status: z.enum(["TERSEDIA", "TERPASANG", "RUSAK"], {
    errorMap: () => ({ message: "Status wajib dipilih." }),
  }),
  id_olt: z.number().int().positive("OLT wajib dipilih."),
  id_odp: z.number().int().positive("ODP wajib dipilih."),
});

// Path halaman untuk revalidate cache Next.js
const PORT_PON_PATH = "/masterdata/port-pon";

// ======================================================
// Ambil data Port PON dengan search & pagination
// ======================================================
export const getPortPons = async (search: string = "", page: number = 1) => {
  const where = search
    ? {
        OR: [
          { tipe_kartu: { contains: search } },
          { olt: { nama_olt: { contains: search } } },
          { odp: { nama_odp: { contains: search } } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.portPon.findMany({
      where,
      // Batasi field relasi -- olt punya kolom Decimal (latitude/longitude)
      // dan data sensitif (username_olt/password_olt) yang tidak boleh/perlu
      // ikut terkirim ke Client Component. Select seperlunya saja.
      include: {
        olt: { select: { id_olt: true, nama_olt: true } },
        odp: { select: { id_odp: true, nama_odp: true } },
      },
      orderBy: [{ id_olt: "asc" }, { nomor_port: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.portPon.count({ where }),
  ]);

  return {
    data,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
};

// ======================================================
// Dropdown OLT & ODP
// ======================================================
export const getOlts = async () => {
  return prisma.olt.findMany({
    select: { id_olt: true, nama_olt: true },
    orderBy: { nama_olt: "asc" },
  });
};

export const getOdps = async () => {
  return prisma.odp.findMany({
    select: { id_odp: true, nama_odp: true },
    orderBy: { nama_odp: "asc" },
  });
};

// ======================================================
// Tambah Port PON
// ======================================================
export const createPortPon = async (formData: FormData) => {
  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    nomor_port: parseFloat(formData.get("nomor_port") as string) || 0,
    tipe_kartu: (formData.get("tipe_kartu") as string)?.trim() || "",
    status: (formData.get("status") as string) || "TERSEDIA",
    id_olt: parseInt(formData.get("id_olt") as string, 10) || 0,
    id_odp: parseInt(formData.get("id_odp") as string, 10) || 0,
  };

  // Parse validation
  const parseResult = portPonValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  await prisma.portPon.create({
    data: {
      nomor_port: validated.nomor_port,
      tipe_kartu: validated.tipe_kartu,
      status: validated.status,
      id_olt: validated.id_olt,
      id_odp: validated.id_odp,
    },
  });

  revalidatePath(PORT_PON_PATH);
};

// ======================================================
// Update Port PON
// ======================================================
export const updatePortPon = async (id: number, formData: FormData) => {
  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    nomor_port: parseFloat(formData.get("nomor_port") as string) || 0,
    tipe_kartu: (formData.get("tipe_kartu") as string)?.trim() || "",
    status: (formData.get("status") as string) || "TERSEDIA",
    id_olt: parseInt(formData.get("id_olt") as string, 10) || 0,
    id_odp: parseInt(formData.get("id_odp") as string, 10) || 0,
  };

  // Parse validation
  const parseResult = portPonValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  await prisma.portPon.update({
    where: { id_port: id },
    data: {
      nomor_port: validated.nomor_port,
      tipe_kartu: validated.tipe_kartu,
      status: validated.status,
      id_olt: validated.id_olt,
      id_odp: validated.id_odp,
    },
  });

  revalidatePath(PORT_PON_PATH);
};

// ======================================================
// Hapus Port PON
// ======================================================
export const deletePortPon = async (id: number) => {
  await prisma.portPon.delete({ where: { id_port: id } });
  revalidatePath(PORT_PON_PATH);
};