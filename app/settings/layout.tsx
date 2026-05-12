"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Palette, UserRound, Image, Lock } from "lucide-react";
import { ExpandedTabs } from "@/components/ui/expanded-tabs";
import { useAuthStore } from "@/app/stores/useAuthStore";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { authUser, isCheckingAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Define all tabs
  const allTabs = [
    { label: "Appearance", icon: Palette, path: "/settings/appearance" },
    { label: "Profile", icon: UserRound, path: "/settings/profile" },
    { label: "Photos", icon: Image, path: "/settings/photos" },
    { label: "Security", icon: Lock, path: "/settings/security" },
  ];

  // Only show protected tabs if user is logged in
  const tabs = authUser
    ? allTabs
    : allTabs.filter((tab) => tab.path === "/settings/appearance");

  // Issue 3A fixed: guard with isCheckingAuth so we don't redirect a logged-in
  // user before checkAuth has had a chance to resolve their session.
  useEffect(() => {
    if (isCheckingAuth) return;
    if (!authUser) {
      const protectedPaths = ["/settings/profile", "/settings/photos", "/settings/security"];
      if (protectedPaths.includes(pathname)) {
        router.replace("/settings/appearance");
      }
    }
  }, [authUser, isCheckingAuth, pathname, router]);

  return (
    <div className="w-full">
      <div className="p-4 max-w-3xl mx-auto space-y-6">
        <ExpandedTabs tabs={tabs} />
        {children}
      </div>
    </div>
  );
}
