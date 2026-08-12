import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";

export async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== Role.ADMIN) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, message: "Akses ditolak. Hanya Admin yang dapat mengimpor data." },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, session };
}

export async function parseExcelFile(file: File) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

  if (!rows.length) {
    throw new Error("File Excel kosong");
  }

  return rows;
}

export function normalizeString(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

export function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function toDecimal(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const text = value.trim().toLowerCase();
    if (["true", "1", "ya", "y"].includes(text)) return true;
    if (["false", "0", "tidak", "n"].includes(text)) return false;
  }
  return Boolean(value);
}

export function isDuplicate(values: string[]) {
  return values.filter((value, index) => value && values.indexOf(value) !== index);
}

export function escapeForLog(value: unknown) {
  return String(value ?? "").trim();
}
