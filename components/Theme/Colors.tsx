import React from "react";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const themeOptions = [
  {
    name: "neutral",
    previewColors: ["#0a0a0a", "#171717", "#3c3c3c", "#404040"],
  },
  {
    name: "zinc",
    previewColors: ["#09090b", "#18181b", "#3c3c3f", "#3f3f46"],
  },
  {
    name: "slate",
    previewColors: ["#020618", "#0f172b", "#353b4c", "#314158"],
  },
  {
    name: "stone",
    previewColors: ["#0c0a09", "#1c1917", "#3e3c3c", "#44403b"],
  },
  {
    name: "gray",
    previewColors: ["#030712", "#101828", "#373c47", "#364153"],
  },
];

interface ColorsProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

const Colors = ({ currentTheme, onThemeChange }: ColorsProps) => {
  return (
    <div className="space-y-2">
      <Label>Color</Label>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {themeOptions.map(({ name, previewColors }) => {
          const isSelected = currentTheme === name;

          return (
            <Button
              key={name}
              variant="outline"
              className={cn(
                "flex-col h-auto py-3 px-2 gap-2",
                isSelected &&
                  "ring-2 ring-ring ring-offset-2 ring-offset-card bg-muted",
              )}
              style={{
                backgroundColor: previewColors[1],
              }}
              onClick={() => onThemeChange(name)}
            >
              {/* Theme Name with Check */}
              <div className="flex items-center justify-center w-full gap-2">
                <span className="text-sm capitalize font-medium">{name}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0" />}
              </div>

              {/* Color Preview Circles */}
              <div className="flex gap-2 w-full justify-center">
                {previewColors.map((colorHex, index) => (
                  <span
                    key={index}
                    className="aspect-square max-w-8 w-full rounded-sm outline -outline-offset-1 outline-black/10 sm:rounded-md dark:outline-white/10"
                    style={{ backgroundColor: colorHex }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default Colors;
