"use client";

import BaseHeader from "@/components/BaseHeader";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      {/* <BaseHeader /> */}
      {children}
    </div>
  );
}
