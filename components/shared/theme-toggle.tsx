"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { Moon, Sun, Monitor } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setThemePreference } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-11 w-11 rounded-xl border border-slate-200" />;
  }

  const getIcon = () => {
    switch (theme) {
      case "dark":
        return <Moon size={20} />;
      case "light":
        return <Sun size={20} />;
      default:
        return <Monitor size={20} />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case "dark":
        return "Mode Gelap";
      case "light":
        return "Mode Terang";
      default:
        return "Mode Sistem";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-xl border border-slate-200 p-3 transition hover:bg-slate-100 hover:scale-110 active:scale-95 dark:border-slate-700 dark:hover:bg-slate-800"
        title={getLabel()}
      >
        {getIcon()}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-14 z-50 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <button
              onClick={() => { setThemePreference("LIGHT"); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-slate-100 hover:scale-105 active:scale-95 dark:hover:bg-slate-800 ${theme === "light" ? "bg-slate-100 dark:bg-slate-800" : ""}`}
            >
              <Sun size={16} className="text-amber-500" />
              <span>Terang</span>
            </button>
            <button
              onClick={() => { setThemePreference("DARK"); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-slate-100 hover:scale-105 active:scale-95 dark:hover:bg-slate-800 ${theme === "dark" ? "bg-slate-100 dark:bg-slate-800" : ""}`}
            >
              <Moon size={16} className="text-indigo-500" />
              <span>Gelap</span>
            </button>
            <button
              onClick={() => { setThemePreference("SYSTEM"); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-slate-100 hover:scale-105 active:scale-95 dark:hover:bg-slate-800 ${theme === "system" ? "bg-slate-100 dark:bg-slate-800" : ""}`}
            >
              <Monitor size={16} className="text-slate-500" />
              <span>Sistem</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
