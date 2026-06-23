"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Radius from "@/components/Theme/Radius.client";
import ThemeSelector from "@/components/Theme/ThemeSelector.client";
import { Palette, CircleDot } from "lucide-react";
import { Label as LabelComponent } from "@/components/ui/label";
import SectionDivider from "@/components/ui/section-divider";

const Appearance = () => {
  return (
    <div className="p-4 pt-6 max-w-3xl mx-auto space-y-6">
      <h1 className="sr-only">Appearance Settings</h1>

      <div className="space-y-10">
        <div className="space-y-4">
          <SectionDivider icon={Palette} label="THEME" />
          <ThemeSelector />
        </div>

        <div className="space-y-4">
          <SectionDivider icon={CircleDot} label="RADIUS" />
          <Radius />
        </div>
      </div>
    </div>
  );
};

export default Appearance;
