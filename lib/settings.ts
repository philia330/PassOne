import { prisma } from "@/lib/prisma";

export async function getSettings() {
  const rows = await prisma.settings.findMany();

  const map: Record<string, string> = {};
  rows.forEach((row) => {
    map[row.key] = row.value;
  });

  return {
    app_name: map.app_name ?? "PASSNET",
    app_subtitle: map.app_subtitle ?? "Broadband Management System",
    login_title: map.login_title ?? "Selamat Datang Kembali",
    login_subtitle: map.login_subtitle ?? "Masuk untuk mengelola sistem jaringan PASSNET",
    login_logo: map.login_logo ?? null,
    favicon: map.favicon || null,
    app_font: map.app_font ?? "inter",
    app_font_size: Number(map.app_font_size ?? 16),
    footer_text: map.footer_text ?? "© 2026 PASSNET. All rights reserved.",
  };
}