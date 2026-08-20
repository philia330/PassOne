"use server";

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "logo");

export async function updateSettings(formData: FormData) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Tidak memiliki akses.");
  }

  const appName = formData.get("app_name") as string;
  const appSubtitle = formData.get("app_subtitle") as string;
  const loginTitle = formData.get("login_title") as string;
  const loginSubtitle = formData.get("login_subtitle") as string;
  const appFont = formData.get("app_font") as string;
  const appFontSize = formData.get("app_font_size") as string;
  const footerText = formData.get("footer_text") as string;
  const logoFile = formData.get("logo") as File | null;

  const updates: { key: string; value: string }[] = [
    { key: "app_name", value: appName },
    { key: "app_subtitle", value: appSubtitle },
    { key: "login_title", value: loginTitle },
    { key: "login_subtitle", value: loginSubtitle },
    { key: "app_font", value: appFont },
    { key: "app_font_size", value: appFontSize },
    { key: "footer_text", value: footerText },
  ];

  // Kalau ada file logo baru diupload
  if (logoFile && logoFile.size > 0) {
    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = logoFile.name.split(".").pop();
    const fileName = `logo-${Date.now()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    const bytes = await logoFile.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const publicPath = `/uploads/logo/${fileName}`;
    updates.push({ key: "login_logo", value: publicPath });
  }

  // Upsert semua settings
  await Promise.all(
    updates.map((item) =>
      prisma.settings.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: { key: item.key, value: item.value },
      })
    )
  );

await logActivity("SETTINGS_UPDATED", `Pengaturan aplikasi diperbarui oleh ${session.user.nama}.`, session.user.id_user);

  revalidatePath("/", "layout");

  return { success: true };
}