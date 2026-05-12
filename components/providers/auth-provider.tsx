"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/app/stores/useAuthStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Issue 2A fixed: use empty deps + getState() to clearly communicate
    // "run exactly once on mount". Avoids accidental re-runs if the store
    // is ever refactored and checkAuth's reference changes.
    useAuthStore.getState().checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}