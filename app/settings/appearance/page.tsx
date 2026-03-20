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
          <ThemeSelector />
          <Radius />
        </CardContent>
      </Card>
    </>
  );
};

export default Appearance;