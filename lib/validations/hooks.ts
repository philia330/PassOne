/**
 * ======================================
 * FORM VALIDATION HOOKS
 * Aplikasi Passnet
 * ======================================
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { z, ZodError, ZodSchema } from "zod";

/**
 * ======================================
 * TYPE DEFINITIONS
 * ======================================
 */

export type ValidationError = {
  field: string;
  message: string;
};

export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
};

/**
 * ======================================
 * INPUT VALIDATION HELPERS (for onChange handlers)
 * ======================================
 */

/** Validate and sanitize name input - letters, spaces, dots, apostrophes only */
export function validateNameInput(value: string, maxLength = 100): string {
  // Remove characters that are not letters, spaces, dots, or apostrophes
  return value
    .replace(/[^a-zA-Z\s\.\']/g, "")
    .slice(0, maxLength);
}

/** Validate and sanitize username input - letters, numbers, underscores only */
export function validateUsernameInput(value: string, maxLength = 30): string {
  return value
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, maxLength);
}

/** Validate and sanitize phone input - digits only with Indonesian format */
export function validatePhoneInput(value: string, maxLength = 15): string {
  // Remove all non-digit characters, then ensure it starts with 0 or 62
  const digitsOnly = value.replace(/\D/g, "");

  // If starts with 62, convert to 0 format
  if (digitsOnly.startsWith("62") && digitsOnly.length > 2) {
    return "0" + digitsOnly.slice(2).slice(0, maxLength);
  }

  return digitsOnly.slice(0, maxLength);
}

/** Validate and sanitize NIK input - exactly 16 digits */
export function validateNikInput(value: string, maxLength = 16): string {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

/** Validate and sanitize serial number input - alphanumeric with hyphens */
export function validateSerialInput(value: string, maxLength = 50): string {
  return value
    .replace(/[^a-zA-Z0-9\-]/g, "")
    .slice(0, maxLength);
}

/** Validate and sanitize general text input */
export function validateTextInput(value: string, maxLength = 255): string {
  return value.slice(0, maxLength);
}

/** Validate and sanitize coordinate input */
export function validateCoordinateInput(value: string, isLatitude = true): string {
  // Allow digits, minus sign at start, and one decimal point
  const cleaned = value.replace(/[^\d.-]/g, "");

  // Only allow minus at the beginning
  if (cleaned.indexOf("-") > 0) {
    return cleaned.replace(/-/g, "");
  }

  // Only allow one decimal point
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    return parts[0] + "." + parts.slice(1).join("");
  }

  return cleaned;
}

/** Validate numeric input - digits only */
export function validateNumericInput(value: string, maxLength = 10): string {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

/**
 * ======================================
 * VALIDATION HOOK
 * ======================================
 */

export function useFormValidation<T extends Record<string, unknown>>(
  schema: ZodSchema<T>,
  initialValues?: Partial<T>
) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [values, setValues] = useState<Partial<T>>(initialValues || {});

  const setValue = useCallback((field: keyof T, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when value changes
    setErrors((prev) => prev.filter((e) => e.field !== field));
  }, []);

  const validate = useCallback(
    (data: T): ValidationResult<T> => {
      try {
        const validated = schema.parse(data);
        setErrors([]);
        return { success: true, data: validated };
      } catch (error) {
        if (error instanceof ZodError) {
          const newErrors: ValidationError[] = error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          }));
          setErrors(newErrors);
          return { success: false, errors: newErrors };
        }
        return { success: false, errors: [{ field: "_form", message: "Validasi gagal" }] };
      }
    },
    [schema]
  );

  const getFieldError = useCallback(
    (field: string): string | undefined => {
      return errors.find((e) => e.field === field)?.message;
    },
    [errors]
  );

  const hasErrors = useMemo(() => errors.length > 0, [errors]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    values,
    setValue,
    setValues,
    errors,
    validate,
    getFieldError,
    hasErrors,
    clearErrors,
  };
}

/**
 * ======================================
 * SIMPLE VALIDATION HELPERS
 * ======================================
 */

export function validateEmail(email: string): string | null {
  if (!email) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Format email tidak valid.";
  }
  if (email.length > 254) {
    return "Email maksimal 254 karakter.";
  }
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone) return null;
  const phoneRegex = /^(\+?62|0)[0-9]{9,14}$/;
  if (!phoneRegex.test(phone)) {
    return "Nomor HP tidak valid. Gunakan format: 08xxxxxxxxxx atau +62xxxxxxxxxxx";
  }
  return null;
}

export function validateNik(nik: string): string | null {
  if (!nik) return null;
  if (nik.length !== 16) {
    return "NIK harus tepat 16 digit.";
  }
  if (!/^\d+$/.test(nik)) {
    return "NIK hanya boleh berisi angka.";
  }
  return null;
}

export function validateRequired(value: string | null | undefined, fieldName: string): string | null {
  if (!value || value.trim() === "") {
    return `${fieldName} wajib diisi.`;
  }
  return null;
}

export function validateMinLength(value: string, minLength: number, fieldName: string): string | null {
  if (value.length < minLength) {
    return `${fieldName} minimal ${minLength} karakter.`;
  }
  return null;
}

export function validateMaxLength(value: string, maxLength: number, fieldName: string): string | null {
  if (value.length > maxLength) {
    return `${fieldName} maksimal ${maxLength} karakter.`;
  }
  return null;
}

export function validatePositiveNumber(value: number, fieldName: string): string | null {
  if (isNaN(value) || value <= 0) {
    return `${fieldName} harus lebih dari 0.`;
  }
  return null;
}

export function validateNonNegative(value: number, fieldName: string): string | null {
  if (isNaN(value) || value < 0) {
    return `${fieldName} tidak boleh kurang dari 0.`;
  }
  return null;
}

/**
 * ======================================
 * CHARACTER COUNTER
 * ======================================
 */

export function useCharacterCount(maxLength: number) {
  const [count, setCount] = useState(0);

  const handleChange = useCallback(
    (value: string) => {
      setCount(value.length);
      return value.slice(0, maxLength);
    },
    [maxLength]
  );

  const isNearLimit = count > maxLength * 0.8;
  const isAtLimit = count >= maxLength;

  return {
    count,
    handleChange,
    isNearLimit,
    isAtLimit,
    maxLength,
    remaining: maxLength - count,
  };
}
