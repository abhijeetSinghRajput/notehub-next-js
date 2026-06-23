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

const Appearance = () => {
  return (
    <>
      <h1 className="sr-only">Appearance Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Customize Theme</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Pick a style and color for your components.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-6 pb-4">
              <span className="border-b flex-1"/>
              <div className="flex items-center gap-2">
                <Palette className="size-4" />
                <LabelComponent>THEME</LabelComponent>
              </div>
              <span className="border-b flex-1"/>
            </div>
            <ThemeSelector />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-6 pb-4">
              <span className="border-b flex-1"/>
              <div className="flex items-center gap-2">
                <CircleDot className="size-4" />
                <LabelComponent>RADIUS</LabelComponent>
              </div>
              <span className="border-b flex-1"/>
            </div>
            <Radius />
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default Appearance;