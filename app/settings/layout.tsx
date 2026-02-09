"use client";

import React from "react";
import { Palette, UserRound, Image, Lock } from "lucide-react";
import { ExpandedTabs } from "@/components/ui/expanded-tabs";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tabs = [
    {
      label: "Appearance",
      icon: Palette,
      path: "/settings/appearance",
    },
    {
      label: "Profile",
      icon: UserRound,
      path: "/settings/profile",
    },
    {
      label: "Photos",
      icon: Image,
      path: "/settings/photos",
    },
    {
      label: "Security",
      icon: Lock,
      path: "/settings/security",
    },
  ];

  return (
    <div className="w-full">
      <div className="p-4 max-w-3xl mx-auto space-y-6">
        {/* Tabs stay persistent */}
        <ExpandedTabs tabs={tabs} />

        {/* This replaces <Outlet /> */}
        {children}
      </div>
    </div>
  );
}
