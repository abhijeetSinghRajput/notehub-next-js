"use client";

import React, { useLayoutEffect } from "react";
import { useLocalStorage } from "@/app/stores/useLocalStorage";
import { useThemeStore } from "@/app/stores/useThemeStore";
import { useTheme } from "@/components/theme-provider";
import ThemeSkeletonIcon from "@/components/icons/ThemeSkeletonIcon";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type ThemeId = "dark" | "light" | "warm";

const themes: {
  id: ThemeId;
  label: string;
  dataTheme: string;
  mode: "dark" | "light";
  preview: { bg: string; fg: string };
}[] = [
  {
    id: "dark",
    label: "Dark",
    dataTheme: "neutral",
    mode: "dark",
    preview: { bg: "#0a0a0a", fg: "#d4d4d4" },
  },
  {
    id: "light",
    label: "Light",
    dataTheme: "neutral",
    mode: "light",
    preview: { bg: "#ffffff", fg: "#171717" },
  },
  {
    id: "warm",
    label: "Warm",
    dataTheme: "warm",
    mode: "light",
    preview: { bg: "#fff9db", fg: "#d5b036" },
  },
];

function getActiveTheme(dataTheme: string, mode: string): ThemeId {
  if (dataTheme === "warm") return "warm";
  if (mode === "dark") return "dark";
  return "light";
}

export default function ThemeSelector() {
  const dataTheme = useLocalStorage((s) => s.theme);
  const setDataTheme = useLocalStorage((s) => s.setTheme);
  const updateVariable = useThemeStore((s) => s.updateVariable);
  const { resolvedTheme, setTheme: setMode } = useTheme();

  const active = getActiveTheme(dataTheme, resolvedTheme);

  // Sync data-theme attribute
  useLayoutEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute(
        "data-theme",
        dataTheme.toLowerCase(),
      );
    }
  }, [dataTheme]);

  // Update CSS variables after theme change
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      const frame = requestAnimationFrame(() => updateVariable());
      return () => cancelAnimationFrame(frame);
    }
  }, [dataTheme, resolvedTheme, updateVariable]);

  const handleSelect = (theme: (typeof themes)[number]) => {
    if (theme.id === "dark") {
      // Just toggle to dark mode, preserve current data-theme
      setMode("dark");
    } else {
      // Switch to the selected data-theme and its mode
      setDataTheme(theme.dataTheme);
      setMode(theme.mode);
    }
  };

  // Toggle logic: if warm, show dark|warm; if light, show dark|light
  let toggleThemes: typeof themes = [];
  if (active === "warm") {
    toggleThemes = themes.filter(t => t.id === "dark" || t.id === "warm");
  } else {
    toggleThemes = themes.filter(t => t.id === "dark" || t.id === "light");
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4">
      {toggleThemes.map((theme) => {
        const isSelected = active === theme.id;
        return (
          <div key={theme.id} className="flex flex-col items-center gap-2">
            <button
              onClick={() => handleSelect(theme)}
              className={cn(
                "relative rounded-xl overflow-hidden border-2 border-transparent transition-all cursor-pointer",
                isSelected && "ring-2 ring-ring ring-offset-2 ring-offset-card",
              )}
            >
              <ThemeSkeletonIcon bg={theme.preview.bg} fg={theme.preview.fg} />
            </button>
            <div className="flex items-center gap-1.5 text-sm font-medium">
              {theme.label}
              {isSelected && <Check className="h-3.5 w-3.5" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
