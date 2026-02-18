"use client";

import React, { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface ColorOption {
  name: string;
  textColor: string;
  bgColor: string;
  type: "text" | "bg";
}

const TEXT_COLORS: ColorOption[] = [
  { name: "Default", textColor: "var(--foreground)", bgColor: "transparent", type: "text" },
  { name: "Gray", textColor: "var(--c-graTexSec)", bgColor: "transparent", type: "text" },
  { name: "Brown", textColor: "var(--c-broTexSec)", bgColor: "transparent", type: "text" },
  { name: "Orange", textColor: "var(--c-oraTexSec)", bgColor: "transparent", type: "text" },
  { name: "Yellow", textColor: "var(--c-yelTexSec)", bgColor: "transparent", type: "text" },
  { name: "Green", textColor: "var(--c-greTexSec)", bgColor: "transparent", type: "text" },
  { name: "Blue", textColor: "var(--c-bluTexSec)", bgColor: "transparent", type: "text" },
  { name: "Purple", textColor: "var(--c-purTexSec)", bgColor: "transparent", type: "text" },
  { name: "Pink", textColor: "var(--c-pinTexSec)", bgColor: "transparent", type: "text" },
  { name: "Red", textColor: "var(--c-redTexSec)", bgColor: "transparent", type: "text" },
];

const BACKGROUND_COLORS: ColorOption[] = [
  { name: "Default", textColor: "var(--foreground)", bgColor: "transparent", type: "bg" },
  { name: "Gray", textColor: "var(--c-graTexSec)", bgColor: "var(--c-graBacSec)", type: "bg" },
  { name: "Brown", textColor: "var(--c-broTexSec)", bgColor: "var(--c-broBacSec)", type: "bg" },
  { name: "Orange", textColor: "var(--c-oraTexSec)", bgColor: "var(--c-oraBacSec)", type: "bg" },
  { name: "Yellow", textColor: "var(--c-yelTexSec)", bgColor: "var(--c-yelBacSec)", type: "bg" },
  { name: "Green", textColor: "var(--c-greTexSec)", bgColor: "var(--c-greBacSec)", type: "bg" },
  { name: "Blue", textColor: "var(--c-bluTexSec)", bgColor: "var(--c-bluBacSec)", type: "bg" },
  { name: "Purple", textColor: "var(--c-purTexSec)", bgColor: "var(--c-purBacSec)", type: "bg" },
  { name: "Pink", textColor: "var(--c-pinTexSec)", bgColor: "var(--c-pinBacSec)", type: "bg" },
  { name: "Red", textColor: "var(--c-redTexSec)", bgColor: "var(--c-redBacSec)", type: "bg" },
];

interface ColorPickerProps {
  editor: any;
}

export const ColorPickerDropdown: React.FC<ColorPickerProps> = ({ editor }) => {
  const [selectedTextColor, setSelectedTextColor] = useState(TEXT_COLORS[0]);
  const [selectedBgColor, setSelectedBgColor] = useState(BACKGROUND_COLORS[0]);
  const [recentColors, setRecentColors] = useState<ColorOption[]>([]);

  // Update active colors based on editor state
  useEffect(() => {
    if (!editor) return;

    // Find active text color
    const activeTextColor = TEXT_COLORS.find((color) =>
      editor.isActive("textStyle", { color: color.textColor })
    );
    if (activeTextColor) {
      setSelectedTextColor(activeTextColor);
    }

    // Find active background color
    const activeBgColor = BACKGROUND_COLORS.find((color) =>
      editor.isActive("highlight", { color: color.bgColor })
    );
    if (activeBgColor) {
      setSelectedBgColor(activeBgColor);
    }
  }, [editor?.state]);

  const addRecent = (color: ColorOption) => {
    setRecentColors((prev) => {
      const filtered = prev.filter(
        (c) => !(c.name === color.name && c.type === color.type)
      );
      return [color, ...filtered].slice(0, 6);
    });
  };

  const handleSelect = (color: ColorOption) => {
    if (color.type === "text") {
      setSelectedTextColor(color);
      if (color.name === "Default") {
        editor.chain().focus().unsetColor().run();
      } else {
        editor.chain().focus().setColor(color.textColor).run();
      }
    } else {
      setSelectedBgColor(color);
      if (color.name === "Default") {
        editor.chain().focus().unsetHighlight().run();
      } else {
        editor.chain().focus().setHighlight({ color: color.bgColor }).run();
      }
    }
    addRecent(color);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-1 px-2">
          <div
            className="w-5 h-5 rounded flex items-center justify-center text-sm font-semibold border"
            style={{
              color: selectedTextColor.textColor,
              backgroundColor: selectedBgColor.bgColor,
            }}
          >
            A
          </div>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56 p-2" align="start">
        {/* Recently Used */}
        {recentColors.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-1 py-1">
              Recently used
            </DropdownMenuLabel>
            <div className="flex gap-1 px-1 pb-2">
              {recentColors.map((color, index) => (
                <DropdownMenuItem
                  key={index}
                  className="w-8 h-8 p-0 rounded flex items-center justify-center text-sm font-semibold cursor-pointer focus:ring-2 focus:ring-primary"
                  style={{
                    color: color.type === "text" ? color.textColor : selectedTextColor.textColor,
                    backgroundColor:
                      color.type === "bg" ? color.bgColor : "transparent",
                    border:
                      color.type === "text"
                        ? "1px solid var(--border)"
                        : color.bgColor === "transparent"
                        ? "1px solid var(--border)"
                        : "none",
                  }}
                  onSelect={() => handleSelect(color)}
                >
                  {color.type === "text" ? "A" : ""}
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Text Colors */}
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-1 py-1">
          Text color
        </DropdownMenuLabel>
        <div className="grid grid-cols-5 gap-1 px-1 pb-2">
          {TEXT_COLORS.map((color) => (
            <DropdownMenuItem
              key={color.name}
              className={`w-8 h-8 p-0 rounded flex items-center justify-center text-sm font-semibold cursor-pointer border focus:ring-2 focus:ring-primary ${
                editor.isActive("textStyle", { color: color.textColor }) ||
                (color.name === "Default" && !editor.isActive("textStyle"))
                  ? "ring-2 ring-primary"
                  : ""
              }`}
              style={{ color: color.textColor }}
              onSelect={() => handleSelect(color)}
            >
              A
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator />

        {/* Background Colors */}
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-1 py-1">
          Background color
        </DropdownMenuLabel>
        <div className="grid grid-cols-5 gap-1 px-1">
          {BACKGROUND_COLORS.map((color) => (
            <DropdownMenuItem
              key={color.name}
              className={`w-8 h-8 p-0 rounded cursor-pointer focus:ring-2 focus:ring-primary ${
                editor.isActive("highlight", { color: color.bgColor }) ||
                (color.name === "Default" && !editor.isActive("highlight"))
                  ? "ring-2 ring-primary"
                  : ""
              }`}
              style={{
                backgroundColor: color.bgColor,
                border:
                  color.bgColor === "transparent"
                    ? "1px solid var(--border)"
                    : "none",
              }}
              onSelect={() => handleSelect(color)}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ColorPickerDropdown;