/**
 * ======================================
 * API VALIDATION HELPERS
 * Aplikasi Passnet
 * ======================================
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { Role, normalizeRole } from "@/lib/auth/roles";

/**
 * ======================================
 * AUTH HELPERS
 * ======================================
 */

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, message: "Sesi tidak valid. Silakan login ulang." },
        { status: 401 }
      ),
    };
  }
  return { ok: true as const, session };
}

export async function requireRole(roles: Role[] | string[]) {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, message: "Sesi tidak valid. Silakan login ulang." },
        { status: 401 }
      ),
    };
  }

  const userRole = normalizeRole(session.user.role);
  const allowedRoles = roles.map((role) => normalizeRole(role)).filter(Boolean) as Role[];

  if (!userRole || !allowedRoles.includes(userRole)) {
    const roleNames = roles.join(", ");
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, message: `Akses ditolak. Hanya ${roleNames} yang dapat melakukan aksi ini.` },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, session };
}

export async function requireAdmin() {
  return requireRole([Role.ADMIN]);
}

export async function requireAdminOrLogistik() {
  return requireRole([Role.ADMIN, Role.LOGISTIK]);
}

export async function requireAdminOrLeader() {
  return requireRole([Role.ADMIN, Role.LEADER]);
}

/**
 * ======================================
 * ID VALIDATION
 * ======================================
 */

export function parseIdsParam(idsParam: string | null): { valid: true; ids: number[] } | { valid: false; error: NextResponse } {
  if (!idsParam || idsParam.trim() === "") {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: "Parameter ID tidak valid." },
        { status: 400 }
      ),
    };
  }

  const ids = idsParam.split(",").map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id));

  if (ids.length === 0) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: "Tidak ada data yang dipilih." },
        { status: 400 }
      ),
    };
  }

  // Check for duplicate IDs
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length !== ids.length) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: "ID duplikat ditemukan." },
        { status: 400 }
      ),
    };
  }

  return { valid: true, ids };
}

export function validateId(id: unknown): { valid: true; id: number } | { valid: false; error: NextResponse } {
  if (id === null || id === undefined || id === "") {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: "ID tidak valid." },
        { status: 400 }
      ),
    };
  }

  const parsed = parseInt(String(id), 10);
  if (isNaN(parsed) || parsed <= 0) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: "ID harus berupa angka positif." },
        { status: 400 }
      ),
    };
  }

  return { valid: true, id: parsed };
}

/**
 * ======================================
 * FILE VALIDATION
 * ======================================
 */

export function validateExcelFile(file: unknown): { valid: true; file: File } | { valid: false; error: NextResponse } {
  if (!(file instanceof File)) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: "File tidak ditemukan." },
        { status: 400 }
      ),
    };
  }

  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "application/octet-stream",
  ];

  const allowedExtensions = [".xlsx", ".xls"];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext));

  if (!hasValidExtension) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: "File harus berformat Excel (.xlsx atau .xls)." },
        { status: 400 }
      ),
    };
  }

  // Max file size: 5MB
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: "Ukuran file maksimal 5MB." },
        { status: 400 }
      ),
    };
  }

  return { valid: true, file };
}

/**
 * ======================================
 * STRING VALIDATION
 * ======================================
 */

export function validateString(
  value: unknown,
  options: {
    fieldName: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    patternMessage?: string;
  }
): { valid: true; value: string } | { valid: false; error: NextResponse } {
  const {
    fieldName,
    required = false,
    minLength,
    maxLength,
    pattern,
    patternMessage,
  } = options;

  if (value === null || value === undefined) {
    if (required) {
      return {
        valid: false,
        error: NextResponse.json(
          { success: false, message: `${fieldName} wajib diisi.` },
          { status: 400 }
        ),
      };
    }
    return { valid: true, value: "" };
  }

  const strValue = String(value).trim();

  if (required && strValue === "") {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: `${fieldName} wajib diisi.` },
        { status: 400 }
      ),
    };
  }

  if (minLength !== undefined && strValue.length < minLength) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: `${fieldName} minimal ${minLength} karakter.` },
        { status: 400 }
      ),
    };
  }

  if (maxLength !== undefined && strValue.length > maxLength) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: `${fieldName} maksimal ${maxLength} karakter.` },
        { status: 400 }
      ),
    };
  }

  if (pattern && !pattern.test(strValue)) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: patternMessage || `${fieldName} format tidak valid.` },
        { status: 400 }
      ),
    };
  }

  return { valid: true, value: strValue };
}

/**
 * ======================================
 * NUMBER VALIDATION
 * ======================================
 */

export function validateNumber(
  value: unknown,
  options: {
    fieldName: string;
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
  }
): { valid: true; value: number } | { valid: false; error: NextResponse } {
  const { fieldName, required = false, min, max, integer = false } = options;

  if (value === null || value === undefined || value === "") {
    if (required) {
      return {
        valid: false,
        error: NextResponse.json(
          { success: false, message: `${fieldName} wajib diisi.` },
          { status: 400 }
        ),
      };
    }
    return { valid: true, value: 0 };
  }

  const numValue = Number(value);

  if (isNaN(numValue)) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: `${fieldName} harus berupa angka.` },
        { status: 400 }
      ),
    };
  }

  if (integer && !Number.isInteger(numValue)) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: `${fieldName} harus berupa angka bulat.` },
        { status: 400 }
      ),
    };
  }

  if (min !== undefined && numValue < min) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: `${fieldName} minimal ${min}.` },
        { status: 400 }
      ),
    };
  }

  if (max !== undefined && numValue > max) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: `${fieldName} maksimal ${max}.` },
        { status: 400 }
      ),
    };
  }

  return { valid: true, value: numValue };
}

/**
 * ======================================
 * SPECIAL FIELD VALIDATIONS
 * ======================================
 */

// Email validation
export function validateEmail(value: unknown): { valid: true; value: string } | { valid: false; error: NextResponse } {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (value === null || value === undefined || value === "") {
    return { valid: true, value: "" };
  }

  const strValue = String(value).trim();

  if (strValue !== "" && !emailPattern.test(strValue)) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: "Format email tidak valid." },
        { status: 400 }
      ),
    };
  }

  if (strValue.length > 254) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: "Email maksimal 254 karakter." },
        { status: 400 }
      ),
    };
  }

  return { valid: true, value: strValue };
}

// Phone number validation (Indonesian format)
export function validatePhone(value: unknown): { valid: true; value: string } | { valid: false; error: NextResponse } {
  const phonePattern = /^(\+?62|0)[0-9]{9,14}$/;

  if (value === null || value === undefined || value === "") {
    return { valid: true, value: "" };
  }

  const strValue = String(value).trim().replace(/\s/g, "");

  if (strValue !== "" && !phonePattern.test(strValue)) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: "Format nomor HP tidak valid. Gunakan format: 08xxxxxxxxxx atau +62xxxxxxxxxxx" },
        { status: 400 }
      ),
    };
  }

  return { valid: true, value: strValue };
}

// NIK validation (16 digits)
export function validateNik(value: unknown): { valid: true; value: string } | { valid: false; error: NextResponse } {
  const nikPattern = /^\d{16}$/;

  if (value === null || value === undefined || value === "") {
    return { valid: true, value: "" };
  }

  const strValue = String(value).trim();

  if (!nikPattern.test(strValue)) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: "NIK harus tepat 16 digit angka." },
        { status: 400 }
      ),
    };
  }

  return { valid: true, value: strValue };
}

// IP Address validation
export function validateIpAddress(value: unknown): { valid: true; value: string } | { valid: false; error: NextResponse } {
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;

  if (value === null || value === undefined || value === "") {
    return { valid: true, value: "" };
  }

  const strValue = String(value).trim();

  if (strValue !== "" && !ipPattern.test(strValue)) {
    // Validate each octet
    const octets = strValue.split(".");
    const allValid = octets.every((octet) => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });

    if (!allValid) {
      return {
        valid: false,
        error: NextResponse.json(
          { success: false, message: "Format IP address tidak valid. Contoh: 192.168.1.1" },
          { status: 400 }
        ),
      };
    }
  }

  return { valid: true, value: strValue };
}

// Coordinate validation
export function validateLatitude(value: unknown): { valid: true; value: number } | { valid: false; error: NextResponse } {
  if (value === null || value === undefined || value === "") {
    return { valid: true, value: 0 };
  }

  const numValue = Number(value);

  if (isNaN(numValue) || numValue < -90 || numValue > 90) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: "Latitude harus di antara -90 dan 90." },
        { status: 400 }
      ),
    };
  }

  return { valid: true, value: numValue };
}

export function validateLongitude(value: unknown): { valid: true; value: number } | { valid: false; error: NextResponse } {
  if (value === null || value === undefined || value === "") {
    return { valid: true, value: 0 };
  }

  const numValue = Number(value);

  if (isNaN(numValue) || numValue < -180 || numValue > 180) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: "Longitude harus di antara -180 dan 180." },
        { status: 400 }
      ),
    };
  }

  return { valid: true, value: numValue };
}

// Enum validation
export function validateEnum<T extends string>(
  value: unknown,
  options: {
    fieldName: string;
    allowedValues: readonly T[];
    required?: boolean;
  }
): { valid: true; value: T } | { valid: false; error: NextResponse } {
  const { fieldName, allowedValues, required = false } = options;

  if (value === null || value === undefined || value === "") {
    if (required) {
      return {
        valid: false,
        error: NextResponse.json(
          { success: false, message: `${fieldName} wajib dipilih.` },
          { status: 400 }
        ),
      };
    }
    return { valid: true, value: allowedValues[0] };
  }

  const strValue = String(value).toUpperCase().trim() as T;

  if (!allowedValues.includes(strValue)) {
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, message: `${fieldName} tidak valid. Pilihan: ${allowedValues.join(", ")}.` },
        { status: 400 }
      ),
    };
  }

  return { valid: true, value: strValue };
}

/**
 * ======================================
 * DUPLICATE CHECKING
 * ======================================
 */

export function findDuplicates(values: (string | null | undefined)[]): string[] {
  const nonNull = values.filter((v): v is string => v !== null && v !== undefined && v !== "");
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const value of nonNull) {
    const lower = value.toLowerCase();
    if (seen.has(lower)) {
      duplicates.push(value);
    }
    seen.add(lower);
  }

  return duplicates;
}

/**
 * ======================================
 * ERROR HANDLER
 * ======================================
 */

export function handleApiError(error: unknown, context?: string): NextResponse {
  console.error(`API ERROR${context ? ` [${context}]` : ""}:`, error);

  if (error instanceof z.ZodError) {
    const messages = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`);
    return NextResponse.json(
      { success: false, message: messages[0] || "Validasi gagal.", errors: messages },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    // Check for Prisma errors
    if (error.message.includes("PrismaClientKnownRequestError")) {
      if (error.message.includes("P2002")) {
        return NextResponse.json(
          { success: false, message: "Data duplikat ditemukan. Pastikan tidak ada data yang sama." },
          { status: 409 }
        );
      }
      if (error.message.includes("P2025")) {
        return NextResponse.json(
          { success: false, message: "Data tidak ditemukan." },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { success: false, message: "Terjadi kesalahan yang tidak diketahui." },
    { status: 500 }
  );
}
