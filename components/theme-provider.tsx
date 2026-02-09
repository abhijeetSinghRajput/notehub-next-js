"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const ThemeProviderContext = createContext({
  theme: "system" as Theme,
  resolvedTheme: "light" as "light" | "dark",
  setTheme: (_: Theme) => {},
  toggleTheme: () => {},
});

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // 1️⃣ Read localStorage + system theme AFTER mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null;
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

    const activeTheme = stored ?? defaultTheme;

    setTheme(activeTheme);
    setResolvedTheme(activeTheme === "system" ? system : activeTheme);
  }, [defaultTheme, storageKey]);

  // 2️⃣ Apply theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  // 3️⃣ Listen to OS theme changes
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handler = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        setResolvedTheme(e.matches ? "dark" : "light");
      }
    };

    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme]);

  const setThemeSafe = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setTheme(newTheme);
    setResolvedTheme(
      newTheme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : newTheme
    );
  };

  const toggleTheme = () => {
    setThemeSafe(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeProviderContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme: setThemeSafe,
        toggleTheme,
      }}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeProviderContext);
