"use client";

import React, { useEffect, useLayoutEffect } from "react";
import Colors from "./Colors";
import { useLocalStorage } from "@/app/stores/useLocalStorage";
import { useThemeStore } from "@/app/stores/useThemeStore";

const ColorsWrapper = () => {
  const theme = useLocalStorage((state) => state.theme);
  const setTheme = useLocalStorage((state) => state.setTheme);
  const updateVariable = useThemeStore((state) => state.updateVariable);

  // Set the data-theme attribute immediately (synchronously)
  useLayoutEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme.toLowerCase());
    }
  }, [theme]);

  // Read computed styles after CSS has been applied
  useEffect(() => {
    if (typeof document !== "undefined") {
      // Use requestAnimationFrame to ensure CSS cascade has completed
      const frame = requestAnimationFrame(() => {
        updateVariable();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [theme, updateVariable]);

  return <Colors currentTheme={theme} onThemeChange={setTheme} />;
};

export default ColorsWrapper;
