"use server";

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import { logActivity } from "@/lib/activity-log";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "logo");

function getImageExtension(file: File) {
  const extensions: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/x-icon": "ico",
  };

  return extensions[file.type];
}

async function saveUploadedImage(file: File, prefix: string) {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = getImageExtension(file);
  if (!ext) throw new Error(`Format ${prefix} tidak didukung.`);
  const fileName = `${prefix}-${Date.now()}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  return `/uploads/logo/${fileName}`;
}

export async function updateSettings(formData: FormData) {
  const session = await auth();

  if (!session?.user || session.user.role !== Role.ADMIN) {
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
  const logoDarkFile = formData.get("logo_dark") as File | null;
  const removeLogoDark = formData.get("remove_logo_dark") === "true";
  const faviconFile = formData.get("favicon") as File | null;
  const removeFavicon = formData.get("remove_favicon") === "true";

  const primaryColor = formData.get("primary_color") as string | null;
  const timezone = formData.get("timezone") as string | null;
  const maintenanceMode = formData.get("maintenance_mode") === "true";
  const maintenanceMessage = formData.get("maintenance_message") as string | null;

  const updates: { key: string; value: string }[] = [
    { key: "app_name", value: appName },
    { key: "app_subtitle", value: appSubtitle },
    { key: "login_title", value: loginTitle },
    { key: "login_subtitle", value: loginSubtitle },
    { key: "app_font", value: appFont },
    { key: "app_font_size", value: appFontSize },
    { key: "footer_text", value: footerText },
    { key: "maintenance_mode", value: maintenanceMode ? "true" : "false" },
  ];

  if (primaryColor) updates.push({ key: "primary_color", value: primaryColor });
  if (timezone) updates.push({ key: "timezone", value: timezone });
  if (maintenanceMessage !== null) {
    updates.push({ key: "maintenance_message", value: maintenanceMessage });
  }

  if (logoFile && logoFile.size > 0) {
    const publicPath = await saveUploadedImage(logoFile, "logo");
    updates.push({ key: "login_logo", value: publicPath });
  }

  if (logoDarkFile && logoDarkFile.size > 0) {
    const publicPath = await saveUploadedImage(logoDarkFile, "logo-dark");
    updates.push({ key: "login_logo_dark", value: publicPath });
  } else if (removeLogoDark) {
    updates.push({ key: "login_logo_dark", value: "" });
  }

  if (faviconFile && faviconFile.size > 0) {
    const publicPath = await saveUploadedImage(faviconFile, "favicon");
    updates.push({ key: "favicon", value: publicPath });
  } else if (removeFavicon) {
    updates.push({ key: "favicon", value: "" });
  }

  await Promise.all(
    updates.map((item) =>
      prisma.settings.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: { key: item.key, value: item.value },
      })
    )
  );

  await logActivity(
    "SETTINGS_UPDATED",
    `Pengaturan aplikasi diperbarui oleh ${session.user.nama}.`,
    session.user.id_user
  );

  revalidatePath("/", "layout");

  return { success: true };
}