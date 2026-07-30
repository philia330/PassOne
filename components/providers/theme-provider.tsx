"use client";

import * as React from "react";

interface ThemeContextType {
  theme: string;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState("light");

React.useEffect(() => {
  const stored = localStorage.getItem("theme");
  if (stored) {
    setTheme(stored);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(stored);
  }
}, []);

const toggleTheme = () => {
  const newTheme = theme === "light" ? "dark" : "light";
  setTheme(newTheme);
  localStorage.setItem("theme", newTheme);
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(newTheme);
};

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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