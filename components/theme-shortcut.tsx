// components/theme-shortcut.jsx
"use client"
import { useEffect } from "react";
import { useTheme } from "./theme-provider";

export function ThemeShortcut() {
  const { toggleTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "d" && (e.metaKey || e.ctrlKey)) {
        const target = e.target as HTMLElement;
        if (target.closest(".cm-editor")) return;
        e.preventDefault();
        toggleTheme();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggleTheme]);

  return null;
}