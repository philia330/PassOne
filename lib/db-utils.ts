"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/**
 * ======================================
 * HELPER: Cek duplikat sebelum insert/update
 * ======================================
 */

export async function checkDuplicateKode(model: string, kode: string, excludeId?: number): Promise<boolean> {
  const where: any = { [`kode_${model.toLowerCase()}`]: kode };

  if (excludeId) {
    where[`id_${model.toLowerCase()}`] = { not: excludeId };
  }

  const existing = await (prisma as any)[model.toLowerCase()].findFirst({
    where,
  });

  return !!existing;
}

export async function checkDuplicateNik(nik: string, excludeId?: number): Promise<boolean> {
  const where: any = { nik };

  if (excludeId) {
    where.id_fab = { not: excludeId };
  }

  const existing = await prisma.fab.findFirst({ where });
  return !!existing;
}

export async function checkDuplicateKodeBaa(kode: string, excludeId?: number): Promise<boolean> {
  const where: any = { kode_baa: kode };

  if (excludeId) {
    where.id_baa = { not: excludeId };
  }

  const existing = await prisma.baa.findFirst({ where });
  return !!existing;
}

/**
 * ======================================
 * HELPER: Optimistic Locking
 * Mencegah race condition saat edit data
 * ======================================
 */

export async function acquireLock(table: string, id: number, lockTimeout = 5000): Promise<string> {
  const lockKey = `lock:${table}:${id}`;
  const lockValue = `lock_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // Simpan lock di Redis atau cache (kalau ada)
  // Untuk sekarang, kita pakai approach optimistic dengan cek updatedAt

  return lockValue;
}

export async function checkConcurrentEdit(
  table: string,
  id: number,
  expectedUpdatedAt: Date
): Promise<{ hasConflict: boolean; currentData?: any }> {
  const model = table as keyof typeof prisma;
  const prismaModel = (prisma as any)[model];

  if (typeof prismaModel?.findUnique !== "function") {
    return { hasConflict: false };
  }

  const current = await prismaModel.findUnique({
    where: { [`id_${table}`]: id },
    select: { updatedAt: true },
  });

  if (!current) {
    return { hasConflict: true, currentData: null };
  }

  // Bandingkan updatedAt
  const hasConflict = new Date(current.updatedAt).getTime() !== expectedUpdatedAt.getTime();

  return { hasConflict, currentData: current };
}

/**
 * ======================================
 * HELPER: Audit Trail
 * ======================================
 */

export interface AuditEntry {
  action: "CREATE" | "UPDATE" | "DELETE";
  table: string;
  recordId: number;
  userId: number;
  changes?: Record<string, { old: any; new: any }>;
  timestamp: Date;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    // Log ke console untuk development
    console.log("[AUDIT]", JSON.stringify(entry, null, 2));

    // Untuk production, simpan ke tabel audit_log
    // await prisma.auditLog.create({ data: entry });
  } catch (error) {
    console.error("Failed to log audit:", error);
  }
}

export async function createAuditLog(
  action: "CREATE" | "UPDATE" | "DELETE",
  table: string,
  recordId: number,
  changes?: Record<string, { old: any; new: any }>
): Promise<void> {
  const session = await auth();

  if (!session?.user) {
    console.warn("Audit log: No session found");
    return;
  }

  await logAudit({
    action,
    table,
    recordId,
    userId: session.user.id_user as number,
    changes,
    timestamp: new Date(),
  });
}

/**
 * ======================================
 * HELPER: Validasi data sebelum save
 * ======================================
 */

export function sanitizeString(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.trim().slice(0, 1000); // Max 1000 chars
}

export function sanitizeNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

export function validateRequired(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === "") {
    throw new Error(`${fieldName} wajib diisi.`);
  }
}

export function validatePositiveNumber(value: any, fieldName: string): number {
  const num = Number(value);
  if (isNaN(num) || num <= 0) {
    throw new Error(`${fieldName} harus berupa angka positif.`);
  }
  return num;
}

/**
 * ======================================
 * HELPER: Transaction dengan retry
 * ======================================
 */

export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(callback);
    } catch (error) {
      lastError = error as Error;

      // P2003 = Foreign key constraint failed
      // P2002 = Unique constraint failed
      // P2034 = Write conflict - bisa di-retry
      const prismaError = error as Prisma.PrismaClientKnownRequestError;

      if (
        attempt < maxRetries &&
        (prismaError.code === "P2034" || prismaError.code === "P2002")
      ) {
        console.log(`Transaction retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

/**
 * ======================================
 * HELPER: Cek hak akses
 * ======================================
 */

export async function checkOwnership(
  table: string,
  recordId: number,
  ownerField: string = "id_user"
): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;

  const model = table as keyof typeof prisma;
  const prismaModel = (prisma as any)[model];

  if (typeof prismaModel?.findUnique !== "function") {
    return false;
  }

  const record = await prismaModel.findUnique({
    where: { [`id_${table}`]: recordId },
    select: { [ownerField]: true },
  });

  return record?.[ownerField] === session.user.id_user;
}
