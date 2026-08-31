/**
 * ======================================
 * VALIDATION UTILITIES - Aplikasi Passnet
 * Helper functions for validation and sanitization
 * ======================================
 */

import { z } from "zod";

/**
 * ======================================
 * STRING SANITIZATION
 * ======================================
 */

/** Remove leading/trailing whitespace and collapse multiple spaces */
export function sanitizeString(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/** Remove all HTML tags */
export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

/** Convert to uppercase */
export function toUpperCase(value: string): string {
  return value.toUpperCase();
}

/**
 * ======================================
 * NUMBER FORMATTING
 * ======================================
 */

/** Format currency to Indonesian Rupiah */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Parse string to number, handling various formats */
export function parseNumber(value: string): number {
  // Remove thousand separators and convert comma to dot
  const cleaned = value.replace(/[.,]/g, (match, offset, str) => {
    // If it's the last comma/period, treat as decimal separator
    if (offset === str.length - 3 && str.slice(-3).includes(",")) {
      return ".";
    }
    return "";
  });
  return parseFloat(cleaned) || 0;
}

/**
 * ======================================
 * PHONE NUMBER UTILITIES
 * ======================================
 */

/** Normalize Indonesian phone numbers */
export function normalizePhoneNumber(value: string): string {
  // Remove all non-digit characters
  let digits = value.replace(/\D/g, "");

  // Convert 62-prefix to 0 if it starts with 62
  if (digits.startsWith("62")) {
    digits = "0" + digits.slice(2);
  }

  return digits;
}

/** Validate and format phone number for display */
export function formatPhoneDisplay(value: string): string {
  const normalized = normalizePhoneNumber(value);

  // Format as 08xx-xxxx-xxxx for display
  if (normalized.length >= 10) {
    return normalized.replace(/(\d{4})(\d{4})(\d{4,5})/, "$1-$2-$3");
  }

  return normalized;
}

/**
 * ======================================
 * COORDINATE UTILITIES
 * ======================================
 */

/** Validate latitude value */
export function isValidLatitude(value: number): boolean {
  return !isNaN(value) && value >= -90 && value <= 90;
}

/** Validate longitude value */
export function isValidLongitude(value: number): boolean {
  return !isNaN(value) && value >= -180 && value <= 180;
}

/** Validate IP address format */
export function isValidIpAddress(value: string): boolean {
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipPattern.test(value)) return false;

  const parts = value.split(".");
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}

/**
 * ======================================
 * CHARACTER VALIDATION HELPERS
 * ======================================
 */

/** Check if string contains only allowed characters */
export function matchesPattern(value: string, pattern: RegExp): boolean {
  return pattern.test(value);
}

/** Check if string contains any dangerous characters */
export function containsDangerousChars(value: string): boolean {
  // Characters that could be used for injection or XSS
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i, // event handlers like onclick=
    /<iframe/i,
    /<embed/i,
    /<object/i,
    /eval\(/i,
    /expression\(/i,
  ];

  return dangerousPatterns.some(pattern => pattern.test(value));
}

/** Remove dangerous characters while preserving safe ones */
export function removeDangerousChars(value: string): string {
  return value
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "");
}

/**
 * ======================================
 * VALIDATION RESULT HELPERS
 * ======================================
 */

/** Format Zod error messages for user display */
export function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((err) => {
    const field = err.path.join(".");
    return `${field ? `${field}: ` : ""}${err.message}`;
  });
}

/** Get first Zod error message */
export function getFirstZodError(error: z.ZodError): string {
  if (error.issues.length === 0) return "Validasi gagal.";
  const first = error.issues[0];
  const field = first.path.join(".");
  return `${field ? `${field}: ` : ""}${first.message}`;
}

/** Create a safe error message for user display */
export function safeErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return getFirstZodError(error);
  }

  if (error instanceof Error) {
    // Don't expose internal error details
    if (error.message.includes("PrismaClientKnownRequestError")) {
      return "Terjadi kesalahan pada database.";
    }
    return error.message;
  }

  return "Terjadi kesalahan yang tidak diketahui.";
}

/**
 * ======================================
 * INPUT TYPE HELPERS
 * ======================================
 */

/** Get appropriate input type for field */
export function getInputType(fieldType: string): string {
  switch (fieldType) {
    case "email":
      return "email";
    case "phone":
      return "tel";
    case "number":
    case "numeric":
      return "number";
    case "password":
      return "password";
    case "url":
      return "url";
    case "search":
      return "search";
    default:
      return "text";
  }
}

/** Get appropriate input mode for mobile keyboards */
export function getInputMode(fieldType: string): string {
  switch (fieldType) {
    case "phone":
      return "numeric";
    case "email":
      return "email";
    case "decimal":
    case "float":
      return "decimal";
    case "number":
    case "numeric":
      return "numeric";
    case "tel":
      return "tel";
    case "search":
      return "search";
    case "url":
      return "url";
    default:
      return "text";
  }
}

/**
 * ======================================
 * VALIDATION CONSTANTS
 * ======================================
 */

export const VALIDATION_LIMITS = {
  // Name fields
  NAMA_MIN: 2,
  NAMA_MAX: 100,

  // Username
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,

  // Email
  EMAIL_MAX: 254,

  // Phone
  PHONE_MIN: 9,
  PHONE_MAX: 15,

  // NIK (Indonesian ID)
  NIK_LENGTH: 16,

  // Address fields
  ALAMAT_MIN: 5,
  ALAMAT_MAX: 500,

  // Description/notes
  KETERANGAN_MAX: 255,
  CATATAN_MAX: 1000,

  // Location
  LOKASI_MAX: 255,

  // Material
  SATUAN_MAX: 20,
  STOK_MAX: 999999,

  // Price
  HARGA_MAX: 999999999999,

  // Port numbers
  PORT_MIN: 0,
  PORT_MAX: 9999,

  // Coordinates
  LATITUDE_MIN: -90,
  LATITUDE_MAX: 90,
  LONGITUDE_MIN: -180,
  LONGITUDE_MAX: 180,

  // Power levels
  RX_POWER_MIN: -60,
  RX_POWER_MAX: 10,
  TX_POWER_MIN: -10,
  TX_POWER_MAX: 20,

  // Ping
  PING_MIN: 0,
  PING_MAX: 10000,

  // Ports
  PORT_NUMBER_MIN: 1,
  PORT_NUMBER_MAX: 256,

  // IP Address
  IP_MAX: 45,

  // Username/Password
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 100,

  // Serial Number
  SERIAL_MIN: 5,
  SERIAL_MAX: 50,

  // Kecepatan (speed)
  KECEPATAN_MAX: 20,

  // Tipe kartu
  TIPE_KARTU_MAX: 50,

  // Model
  MODEL_MAX: 100,
} as const;

/**
 * ======================================
 * REGEX PATTERNS
 * ======================================
 */

export const REGEX_PATTERNS = {
  // Name: letters, spaces, dots, apostrophes
  NAME: /^[a-zA-Z\s\.\']+$/,

  // Username: letters, numbers, underscores only
  USERNAME: /^[a-zA-Z0-9_]+$/,

  // Phone: Indonesian phone formats
  PHONE: /^(\+?62|0)[0-9]{9,14}$/,

  // NIK: exactly 16 digits
  NIK: /^\d{16}$/,

  // IP Address
  IP: /^(\d{1,3}\.){3}\d{1,3}$/,

  // Coordinate (decimal)
  COORDINATE: /^-?\d{1,3}\.\d+$/,

  // Speed/Kecepatan
  KECEPATAN: /^\d+\s*(Mbps|MBps|Gbps|GBps)?$/i,

  // Serial number: alphanumeric with hyphens
  SERIAL: /^[a-zA-Z0-9\-]+$/,

  // Password: at least 6 chars
  PASSWORD: /^.{6,}$/,

  // Safe text: no HTML or script tags
  SAFE_TEXT: /^[^<>]*$/,
} as const;

/**
 * ======================================
 * ERROR MESSAGES (Indonesian)
 * ======================================
 */

export const ERROR_MESSAGES = {
  REQUIRED: "Field ini wajib diisi.",

  // Name
  NAMA_REQUIRED: "Nama wajib diisi.",
  NAMA_TOO_SHORT: "Nama minimal 2 karakter.",
  NAMA_TOO_LONG: "Nama maksimal 100 karakter.",
  NAMA_INVALID: "Nama hanya boleh berisi huruf, spasi, titik, dan apostrof.",

  // Username
  USERNAME_REQUIRED: "Username wajib diisi.",
  USERNAME_TOO_SHORT: "Username minimal 3 karakter.",
  USERNAME_TOO_LONG: "Username maksimal 30 karakter.",
  USERNAME_INVALID: "Username hanya boleh berisi huruf, angka, dan underscore.",

  // Email
  EMAIL_INVALID: "Format email tidak valid.",
  EMAIL_TOO_LONG: "Email maksimal 254 karakter.",

  // Phone
  PHONE_REQUIRED: "Nomor HP wajib diisi.",
  PHONE_INVALID: "Nomor HP tidak valid. Gunakan format: 08xxxxxxxxxx atau +62xxxxxxxxxxx",
  PHONE_TOO_LONG: "Nomor HP maksimal 15 karakter.",

  // NIK
  NIK_REQUIRED: "NIK wajib diisi.",
  NIK_INVALID: "NIK harus tepat 16 digit.",
  NIK_NUMBERS_ONLY: "NIK hanya boleh berisi angka.",

  // Password
  PASSWORD_REQUIRED: "Password wajib diisi.",
  PASSWORD_TOO_SHORT: "Password minimal 6 karakter.",
  PASSWORD_TOO_LONG: "Password maksimal 100 karakter.",

  // Address
  ALAMAT_REQUIRED: "Alamat wajib diisi.",
  ALAMAT_TOO_SHORT: "Alamat minimal 10 karakter.",
  ALAMAT_TOO_LONG: "Alamat maksimal 500 karakter.",

  // Coordinate
  COORDINATE_INVALID: "Koordinat tidak valid.",
  LATITUDE_INVALID: "Latitude harus di antara -90 dan 90.",
  LONGITUDE_INVALID: "Longitude harus di antara -180 dan 180.",

  // Numeric
  NUMBER_REQUIRED: "Nilai wajib diisi.",
  NUMBER_INVALID: "Nilai harus berupa angka.",
  NUMBER_TOO_SMALL: "Nilai terlalu kecil.",
  NUMBER_TOO_LARGE: "Nilai terlalu besar.",
  NUMBER_NEGATIVE: "Nilai tidak boleh negatif.",
  NUMBER_NOT_INTEGER: "Nilai harus berupa angka bulat.",

  // Stock
  STOK_NEGATIVE: "Stok tidak boleh kurang dari 0.",
  STOK_TOO_LARGE: "Stok maksimal 999999.",

  // Price
  HARGA_REQUIRED: "Harga wajib diisi.",
  HARGA_POSITIVE: "Harga harus lebih dari 0.",

  // IP Address
  IP_INVALID: "Format IP address tidak valid. Contoh: 192.168.1.1",

  // Selection
  AREA_REQUIRED: "Area wajib dipilih.",
  PAKET_REQUIRED: "Paket wajib dipilih.",
  SALES_REQUIRED: "Sales wajib dipilih.",
  OLT_REQUIRED: "OLT wajib dipilih.",
  ODP_REQUIRED: "ODP wajib dipilih.",
  POP_REQUIRED: "POP wajib dipilih.",
  ROLE_REQUIRED: "Role wajib dipilih.",
  JKL_REQUIRED: "Jenis kelamin wajib dipilih.",
  FAB_REQUIRED: "FAB wajib dipilih.",
  ONT_REQUIRED: "ONT wajib dipilih.",
  TEKNISI_REQUIRED: "Teknisi utama wajib dipilih.",
  TANGGAL_REQUIRED: "Tanggal instalasi wajib diisi.",

  // Material
  SATUAN_REQUIRED: "Satuan wajib diisi.",
  MINIMAL_STOK_REQUIRED: "Minimal stok wajib diisi.",
  MATERIAL_MIN_ONE: "Minimal harus ada 1 material.",

  // Duplicate
  DUPLICATE_USERNAME: "Username sudah digunakan.",
  DUPLICATE_EMAIL: "Email sudah digunakan.",
  DUPLICATE_NIK: "NIK sudah terdaftar.",
  DUPLICATE_SERIAL: "Serial number sudah ada.",
  DUPLICATE_NAMA: "Nama sudah ada.",

  // File
  FOTO_REQUIRED: "Foto wajib diunggah.",
  FOTO_TOO_LARGE: "Ukuran foto maksimal 2MB.",
  FOTO_INVALID_TYPE: "Format foto harus JPG, PNG, atau WEBP.",
} as const;
