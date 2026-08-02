"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-11 w-11 rounded-xl border border-slate-200" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="rounded-xl border border-slate-200 p-3 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
      title={isDark ? "Mode Terang" : "Mode Gelap"}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}