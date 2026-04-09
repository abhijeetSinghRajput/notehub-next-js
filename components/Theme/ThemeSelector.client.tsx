"use client";

import React, { useLayoutEffect } from "react";
import { useLocalStorage } from "@/app/stores/useLocalStorage";
import { useThemeStore } from "@/app/stores/useThemeStore";
import { useTheme } from "@/components/theme-provider";
import ThemeSkeletonIcon from "@/components/icons/ThemeSkeletonIcon";
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
  // When dark mode is active (via toggle), neither warm nor light should show as active
  if (mode === "dark") return "dark";
  // Only check data-theme for light variants
  if (dataTheme === "warm") return "warm";
  return "light";
}

export default function ThemeSelector({className}: {className?: string}) {
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
    setDataTheme(theme.dataTheme);
    setMode(theme.mode);
  };

  return (
    <div className={cn("grid grid-cols-3 gap-3 sm:gap-4", className)}>
      {themes.map((theme) => {
        const isSelected = active === theme.id;
        return (
          <div key={theme.id} className="flex flex-col items-center gap-2">
            <button
              type="button"
              aria-label={`Select ${theme.label} theme`}
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
