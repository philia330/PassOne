"use client";

import { usePathname, useRouter } from "next/navigation";
import { Settings, Menu, Search } from "lucide-react";

import NotificationBell from "@/components/dashboard/notification-bell";
import ThemeToggle from "@/components/shared/theme-toggle";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedDate = now?.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = now?.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const pageTitle = pathname.split("/").filter(Boolean).pop()?.replace("-", " ");
  const title = pageTitle
    ? pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1)
    : "Dashboard";

  // Open command palette
  const openCommandPalette = () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:h-20 sm:px-8">

      <div className="flex items-center gap-3">
        {/* Tombol hamburger — cuma muncul di mobile */}
        <button
          onClick={onMenuClick}
          className="rounded-xl border border-slate-200 p-2.5 transition hover:bg-slate-100 hover:scale-110 active:scale-95 dark:border-slate-700 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 sm:text-2xl">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search button with keyboard shortcut hint */}
        <button
          onClick={openCommandPalette}
          className={cn(
            "flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2",
            "transition-all duration-200",
            "hover:bg-slate-100 hover:scale-105 active:scale-95",
            "dark:border-slate-700 dark:hover:bg-slate-800",
            "text-slate-600 dark:text-slate-300",
            "group"
          )}
          title="Cari cepat (Ctrl+K)"
        >
          <Search size={18} className="transition-transform group-hover:scale-110" />
          <span className="hidden text-sm font-medium sm:inline">Cari</span>
          <kbd className={cn(
            "hidden sm:flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5",
            "font-mono text-[10px] font-medium text-muted-foreground",
            "group-hover:border-slate-300 dark:group-hover:border-slate-600"
          )}>
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        {now && (
          <div className="flex flex-col items-end mr-1 text-right">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
              {formattedTime}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {formattedDate}
            </span>
          </div>
        )}
        <ThemeToggle />
        <NotificationBell />
        
        <button
          onClick={() => router.push("/workspace?view=settings")}
          className="rounded-xl border border-slate-200 p-2.5 transition hover:bg-slate-100 hover:scale-110 active:scale-95 dark:border-slate-700 dark:hover:bg-slate-800 sm:p-3"
          title="Pengaturan"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}
