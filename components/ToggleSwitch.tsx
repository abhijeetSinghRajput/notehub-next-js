import React from "react";
import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  options: { label: string; icon: React.ReactNode; value: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const ToggleSwitch = ({
  options,
  value,
  onChange,
  className,
}: ToggleSwitchProps) => {
  return (
    <div className={cn("max-w-md w-max", className)}>
      <div className="flex gap-2 rounded-xl p-1 border bg-muted/50">
        {options.map(({ label, icon, value: optionValue }, index) => {
          const isActive = optionValue === value;

          return (
            <div
              key={optionValue ?? index}
              className={cn(
                "flex h-8 items-center bg-muted justify-center overflow-hidden rounded-md cursor-pointer",
                isActive ? "flex-1" : "flex-none w-9"
              )}
              onClick={() => onChange(optionValue)}
            >
              <div className="flex h-8 w-full items-center gap-2 px-2.5">
                {React.isValidElement(icon) || typeof icon === "string" ? icon : null}
                {isActive && (
                  <span className="font-medium whitespace-nowrap">
                    {label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ToggleSwitch;