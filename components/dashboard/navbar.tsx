"use client";

import { usePathname, useRouter } from "next/navigation";
import { Settings, Menu } from "lucide-react";

import NotificationBell from "@/components/dashboard/notification-bell";
import ThemeToggle from "@/components/shared/theme-toggle";

type SettingsData = {
  app_name: string;
  app_subtitle: string;
};

export default function Navbar({
  settings,
  onMenuClick,
}: {
  settings: SettingsData;
  onMenuClick: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const pageTitle = pathname.split("/").filter(Boolean).pop()?.replace("-", " ");
  const title = pageTitle
    ? pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1)
    : "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:h-20 sm:px-8">
      <div className="flex items-center gap-3">
        {/* Tombol hamburger — cuma muncul di mobile */}
        <button
          onClick={onMenuClick}
          className="rounded-xl border border-slate-200 p-2.5 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 sm:text-2xl">
            {title}
          </h1>
          <p className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
            Selamat datang di {settings.app_name} {settings.app_subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <NotificationBell />

        <button
          onClick={() => router.push("/settings")}
          className="rounded-xl border border-slate-200 p-2.5 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 sm:p-3"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}