"use client";

import * as React from "react";
import { useEffect, useState, useCallback } from "react";

interface ThemeContextType {
  theme: string;
  toggleTheme: () => void;
  setThemePreference: (theme: "LIGHT" | "DARK" | "SYSTEM") => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  initialTheme = "SYSTEM"
}: {
  children: React.ReactNode;
  initialTheme?: string;
}) {
  const [theme, setTheme] = useState<string>("system");
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi untuk mendapatkan tema aktual berdasarkan preferensi
  const getEffectiveTheme = useCallback((preference: string): string => {
    if (preference === "SYSTEM") {
      // Cek preferensi sistem
      if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      return "light";
    }
    return preference.toLowerCase();
  }, []);

  // Apply theme ke document
  const applyTheme = useCallback((effectiveTheme: string) => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(effectiveTheme);
    }
  }, []);

  // Initialize theme dari session/user preference
  useEffect(() => {
    const effectiveTheme = getEffectiveTheme(initialTheme);
    setTheme(effectiveTheme);
    applyTheme(effectiveTheme);
    setIsLoading(false);

    // Listen untuk perubahan preferensi sistem jika SYSTEM
    if (initialTheme === "SYSTEM" && typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        const newEffective = getEffectiveTheme("SYSTEM");
        setTheme(newEffective);
        applyTheme(newEffective);
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [initialTheme, getEffectiveTheme, applyTheme]);

  // Toggle theme (langsung switch antara LIGHT dan DARK)
  const toggleTheme = useCallback(() => {
    const currentEffective = getEffectiveTheme(theme);
    const newPreference = currentEffective === "dark" ? "LIGHT" : "DARK";

    // Update state
    setTheme(newPreference.toLowerCase());
    applyTheme(newPreference.toLowerCase());

    // Simpan ke database via API
    fetch("/api/user/theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme_preference: newPreference }),
    }).catch(console.error);
  }, [theme, getEffectiveTheme, applyTheme]);

  // Set theme preference langsung
  const setThemePreference = useCallback(async (preference: "LIGHT" | "DARK" | "SYSTEM") => {
    const effectiveTheme = getEffectiveTheme(preference);

    // Update state
    setTheme(effectiveTheme);
    applyTheme(effectiveTheme);

    // Simpan ke database via API
    try {
      await fetch("/api/user/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme_preference: preference }),
      });

      // Trigger session refresh agar theme_preference di JWT token ikut ter-update
      // Ini penting agar setelah server restart, nilai theme dari token masih benar
      await fetch("/api/auth/session");
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  }, [getEffectiveTheme, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemePreference, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
