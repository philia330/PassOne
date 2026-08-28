"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ont_status } from "@prisma/client";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import { z } from "zod";

const PAGE_SIZE = 10;

// ======================================================
// VALIDATION SCHEMA - ONT
// ======================================================

const ontValidation = z.object({
  serial_number: z
    .string()
    .min(1, "Serial number wajib diisi.")
    .min(5, "Serial number minimal 5 karakter.")
    .max(50, "Serial number maksimal 50 karakter.")
    .regex(/^[a-zA-Z0-9\-]+$/, "Serial number hanya boleh berisi huruf, angka, dan tanda hubung."),
  model: z
    .string()
    .max(100, "Model maksimal 100 karakter.")
    .optional()
    .nullable(),
  status: z.enum(["TERSEDIA", "RUSAK"], {
    message: "Status wajib dipilih.",
  }),
  // id_pop boleh 0 di sini -- khusus createOnt, 0 berarti "belum diisi"
  // dan akan di-derive otomatis dari ODP (lihat logic di createOnt).
  // updateOnt tetap wajib POP asli lewat pengecekan manual di bawah.
  id_pop: z.number().int().min(0, "POP tidak valid."),
  id_odp: z.number().int().positive("ODP wajib dipilih."),
});

/**
 * ======================================
 * HELPER: Audit Log
 * ======================================
 */
async function logActivity(type: string, description: string) {
  const session = await auth();
  try {
    await prisma.activityLog.create({
      data: {
        type: type as any,
        description,
        id_user: session?.user?.id_user as number,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

/**
 * ======================================
 * HELPER: Cek hak akses untuk CREATE ONT
 * TEKNISI boleh create, tapi tidak boleh update/delete
 * ======================================
 */
async function requireCreateAccess() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  const role = session.user.role;
  // ADMIN, LOGISTIK, dan TEKNISI boleh create ONT
  if (role !== Role.ADMIN && role !== Role.LOGISTIK && role !== Role.TEKNISI) {
    throw new Error("Anda tidak memiliki akses untuk membuat ONT.");
  }

  return session;
}

/**
 * ======================================
 * HELPER: Cek hak akses untuk UPDATE/DELETE ONT
 * Hanya ADMIN dan LOGISTIK yang boleh
 * ======================================
 */
async function requireUpdateDeleteAccess() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Sesi tidak valid, silakan login ulang.");
  }

  const role = session.user.role;
  // Hanya ADMIN dan LOGISTIK yang boleh update/delete ONT
  if (role !== Role.ADMIN && role !== Role.LOGISTIK) {
    throw new Error("Anda tidak memiliki akses untuk mengubah atau menghapus ONT.");
  }

  return session;
}

/**
 * ======================================
 * GET DATA
 * ======================================
 */
export const getOnts = async (search: string = "", page: number = 1) => {
  const where = search
    ? {
        OR: [
          { serial_number: { contains: search } },
          { pelanggan: { contains: search } },
          { model: { contains: search } },
          { pop: { nama_pop: { contains: search } } },
          { odp: { nama_odp: { contains: search } } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.ont.findMany({
      where,
      // Batasi field relasi yang diambil -- pop & odp punya kolom Decimal
      // (latitude/longitude) yang tidak boleh dioper langsung ke Client
      // Component. Karena di sini cuma butuh nama-nya, select seperlunya saja.
      include: {
        pop: { select: { id_pop: true, nama_pop: true } },
        odp: { select: { id_odp: true, nama_odp: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.ont.count({ where }),
  ]);

  return { data, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
};

export const getPops = async () => {
  return prisma.pop.findMany({
    select: { id_pop: true, nama_pop: true },
    orderBy: { nama_pop: "asc" },
  });
};

export const getOdps = async () => {
  return prisma.odp.findMany({
    select: { id_odp: true, nama_odp: true },
    orderBy: { nama_odp: "asc" },
  });
};

/**
 * ======================================
 * CREATE ONT
 * ======================================
 */
export const createOnt = async (formData: FormData) => {
  const session = await requireCreateAccess();

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    serial_number: (formData.get("serial_number") as string)?.trim() || "",
    model: (formData.get("model") as string)?.trim() || undefined,
    status: (formData.get("status") as string) || "TERSEDIA",
    id_pop: parseInt(formData.get("id_pop") as string, 10) || 0,
    id_odp: parseInt(formData.get("id_odp") as string, 10) || 0,
  };

  // Parse validation - id_pop is optional if coming from BAA context
  const parseResult = ontValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  // Jika id_pop kosong (BAA context), auto-derive dari ODP
  let finalIdPop = validated.id_pop;
  if (!finalIdPop || finalIdPop === 0) {
    const odp = await prisma.odp.findUnique({
      where: { id_odp: validated.id_odp },
      select: { olt: { select: { id_pop: true } } },
    });
    if (!odp?.olt?.id_pop) {
      throw new Error("ODP tidak memiliki relasi POP. Pilih ODP yang valid.");
    }
    finalIdPop = odp.olt.id_pop;
  }

  // Cek duplikat serial number
  const existing = await prisma.ont.findUnique({
    where: { serial_number: validated.serial_number },
  });

  if (existing) {
    throw new Error(`ONT dengan serial number "${validated.serial_number}" sudah ada.`);
  }

  await prisma.$transaction(async (tx) => {
    // Double-check dalam transaction
    const existingInTx = await tx.ont.findUnique({ where: { serial_number: validated.serial_number } });
    if (existingInTx) {
      throw new Error(`ONT dengan serial number "${validated.serial_number}" sudah ada.`);
    }

    // pelanggan sengaja dikosongkan di sini -- baru terisi otomatis saat
    // ONT ini dipakai di BAA (lihat sinkronisasi di app/jaringan/baa/actions.ts)
    await tx.ont.create({
      data: {
        serial_number: validated.serial_number,
        pelanggan: "",
        model: validated.model || "",
        status: validated.status,
        id_pop: finalIdPop,
        id_odp: validated.id_odp,
      },
    });
  });

  await logActivity("ONT_CREATED", `ONT "${validated.serial_number}" dibuat oleh ${session.user.nama}`);
  revalidatePath("/masterdata/ont");
};

/**
 * ======================================
 * UPDATE ONT
 * ======================================
 */
export const updateOnt = async (id: number, formData: FormData) => {
  const session = await requireUpdateDeleteAccess();

  const existing = await prisma.ont.findUnique({ where: { id_ont: id } });
  if (!existing) {
    throw new Error("ONT tidak ditemukan.");
  }

  // ======================================
  // VALIDASI INPUT
  // ======================================
  const rawData = {
    serial_number: (formData.get("serial_number") as string)?.trim() || "",
    model: (formData.get("model") as string)?.trim() || undefined,
    status: (formData.get("status") as string) || existing.status || "TERSEDIA",
    id_pop: parseInt(formData.get("id_pop") as string, 10) || 0,
    id_odp: parseInt(formData.get("id_odp") as string, 10) || 0,
  };

  // Parse validation
  const parseResult = ontValidation.safeParse(rawData);

  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    throw new Error(firstError.message);
  }

  const validated = parseResult.data;

  // Mode edit selalu menampilkan field POP secara langsung (bukan derived
  // dari ODP seperti di quick-add BAA), jadi di sini POP wajib benar-benar
  // dipilih oleh user -- tidak ada auto-derive.
  if (!validated.id_pop || validated.id_pop <= 0) {
    throw new Error("POP wajib dipilih.");
  }

  // Cek duplikat jika serial berubah
  if (validated.serial_number !== existing.serial_number) {
    const duplicate = await prisma.ont.findFirst({
      where: { serial_number: validated.serial_number, id_ont: { not: id } },
    });

    if (duplicate) {
      throw new Error(`ONT dengan serial number "${validated.serial_number}" sudah ada.`);
    }
  }

  await prisma.$transaction(async (tx) => {
    if (validated.serial_number !== existing.serial_number) {
      const existingInTx = await tx.ont.findFirst({
        where: { serial_number: validated.serial_number, id_ont: { not: id } },
      });
      if (existingInTx) {
        throw new Error(`ONT dengan serial number "${validated.serial_number}" sudah ada.`);
      }
    }

    // pelanggan TIDAK disentuh dari form Master Data -- nilainya cuma boleh
    // berubah lewat sinkronisasi otomatis dari BAA (create/update/delete).
    await tx.ont.update({
      where: { id_ont: id },
      data: {
        serial_number: validated.serial_number,
        model: validated.model || "",
        status: validated.status,
        id_pop: validated.id_pop,
        id_odp: validated.id_odp,
      },
    });
  });

  await logActivity("ONT_UPDATED", `ONT "${validated.serial_number}" diupdate oleh ${session.user.nama}`);
  revalidatePath("/masterdata/ont");
};

/**
 * ======================================
 * DELETE ONT
 * ======================================
 */
export const deleteOnt = async (id: number) => {
  const session = await requireUpdateDeleteAccess();

  const ont = await prisma.ont.findUnique({
    where: { id_ont: id },
    include: { _count: { select: { baa: true } } },
  });

  if (!ont) {
    throw new Error("ONT tidak ditemukan.");
  }

  // Cek apakah ONT dipakai di BAA
  if (ont._count.baa > 0) {
    throw new Error(
      `ONT "${ont.serial_number}" tidak bisa dihapus karena masih dipakai oleh ${ont._count.baa} BAA.`
    );
  }

  await prisma.ont.delete({ where: { id_ont: id } });

  await logActivity("ONT_DELETED", `ONT "${ont.serial_number}" dihapus oleh ${session.user.nama}`);
  revalidatePath("/masterdata/ont");
};