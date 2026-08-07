"use server";

import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_WIDTH = 1200;
const QUALITY = 85;

/**
 * ======================================
 * Helper: Optimize Image to WebP
 * ======================================
 */
export async function optimizeImageToWebP(
  file: File,
  subDir: string = "general"
): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", subDir);
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${subDir}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const filePath = path.join(uploadDir, fileName);

  try {
    await sharp(buffer)
      .resize(MAX_WIDTH, null, {
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality: QUALITY })
      .toFile(filePath);

    return `/uploads/${subDir}/${fileName}`;
  } catch (error) {
    console.error("WebP conversion failed, falling back to original:", error);
    const fallbackName = `${subDir}-${Date.now()}.${file.name.split(".").pop()}`;
    const fallbackPath = path.join(uploadDir, fallbackName);
    await writeFile(fallbackPath, buffer);
    return `/uploads/${subDir}/${fallbackName}`;
  }
}

/**
 * ======================================
 * Helper: Simpan Foto Asli (tanpa konversi)
 * ======================================
 */
export async function saveImageOriginal(
  file: File,
  subDir: string = "general"
): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", subDir);
  await mkdir(uploadDir, { recursive: true });

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${subDir}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = path.join(uploadDir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return `/uploads/${subDir}/${fileName}`;
}
