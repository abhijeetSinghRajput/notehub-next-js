"use client";

import BaseHeader from "@/components/BaseHeader";
import Footer from "@/components/Footer";
import { ReactNode } from "react";

export default function InfoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <BaseHeader />
      {children}
      <Footer/>
    </div>
  );
}
