"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

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
  const getSystemTheme = () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  const initialTheme = useMemo<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    return (window.localStorage.getItem(storageKey) as Theme | null) ?? defaultTheme;
  }, [defaultTheme, storageKey]);

  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return initialTheme === "system" ? getSystemTheme() : initialTheme;
  });

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
    window.localStorage.setItem(storageKey, newTheme);
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
