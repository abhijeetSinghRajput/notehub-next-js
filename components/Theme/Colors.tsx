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
];

interface ColorsProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

const Colors = ({ currentTheme, onThemeChange }: ColorsProps) => {
  return (
    <div className="space-y-2">
      <Label>Color</Label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
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
                <span className="text-white/80 text-sm capitalize font-medium">{name}</span>
                {isSelected && <Check className="text-white/80 h-4 w-4 shrink-0" />}
              </div>

              {/* Color Preview Circles */}
              <div className="flex gap-2 w-full justify-center">
                {previewColors.map((colorHex, index) => (
                  <span
                    key={index}
                    className="aspect-square size-7 rounded-full border-2 border-white/80 -mr-4"
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
