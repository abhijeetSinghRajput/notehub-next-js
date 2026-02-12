// components/providers/auth-provider.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { Loader } from "lucide-react";
import { ThemeProvider } from "../theme-provider";
import Logo from "../Logo";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth, isCheckingAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsInitializing(false);
    };

    initAuth();
  }, [checkAuth]);

  // Show loading screen while checking auth
  if (isCheckingAuth || isInitializing) {
    return (
      <ThemeProvider
        defaultTheme="system"
        storageKey="theme" // ✅ FIXED
      >
        <div className="flex flex-col gap-2 items-center justify-center h-screen">
          <Logo className="text-xl text-foreground/70"/>
          <Loader className="animate-spin" />
        </div>
      </ThemeProvider>
    );
  }

  return <>{children}</>;
}
