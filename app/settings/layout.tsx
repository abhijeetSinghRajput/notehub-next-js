"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Palette, UserRound, Image, Lock } from "lucide-react";
import { useAuthStore } from "@/app/stores/useAuthStore";
import NProgress from "nprogress";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const allTabs = [
  { label: "Appearance", icon: Palette, path: "/settings/appearance" },
  { label: "Profile", icon: UserRound, path: "/settings/profile" },
  { label: "Photos", icon: Image, path: "/settings/photos" },
  { label: "Security", icon: Lock, path: "/settings/security" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authUser, isCheckingAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const tabsListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs = authUser
    ? allTabs
    : allTabs.filter((tab) => tab.path === "/settings/appearance");

  const activeIndex = tabs.findIndex((tab) => pathname.startsWith(tab.path));

  // Center the active tab on mount and on route change
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      tabRefs.current[activeIndex]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [activeIndex]);

  useEffect(() => {
    if (isCheckingAuth) return;
    if (!authUser) {
      const protectedPaths = [
        "/settings/profile",
        "/settings/photos",
        "/settings/security",
      ];
      if (protectedPaths.includes(pathname)) {
        router.replace("/settings/appearance");
      }
    }
  }, [authUser, isCheckingAuth, pathname, router]);

  const handleSelect = (index: number) => {
    const tab = tabs[index];
    if (!tab) return;
    NProgress.start();
    router.push(tab.path);
  };

  return (
    <div className="w-full">
      {/* Sticky tab bar */}
      <div className="bg-background/80 backdrop-blur-sm sticky top-16 z-10">
        <div className="max-w-3xl mx-auto border-b">
          <div
            ref={tabsListRef}
            className="flex overflow-x-auto overflow-y-hidden scrollbar-hide"
            style={{ scrollBehavior: "smooth", willChange: "scroll-position" }}
          >
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeIndex === index;

              return (
                <Button
                  key={tab.path}
                  variant={"ghost"}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  onClick={() => handleSelect(index)}
                  className={cn(
                    "px-5 py-3.5 h-auto text-muted-foreground rounded-none border-b flex-1",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40",
                    // Focus ring
                    "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 rounded-t-sm",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
