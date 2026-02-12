import React from "react";
import { motion, AnimatePresence } from "framer-motion";
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
            <motion.div
              key={optionValue ?? index}
              layout
              className={cn(
                "flex h-8 items-center bg-muted justify-center overflow-hidden rounded-md cursor-pointer transition-colors",
                isActive ? "flex-1" : "flex-none"
              )}
              onClick={() => onChange(optionValue)}
              initial={false}
              animate={{ width: isActive ? 120 : 36 }}
              transition={{ type: "tween", duration: 0.25 }}
            >
              <motion.div
                className="flex h-8 w-full items-center gap-2 px-2.5"
                animate={{ filter: "blur(0px)" }}
                exit={{ filter: "blur(2px)" }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {React.isValidElement(icon) || typeof icon === "string" ? icon : null}

                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.span
                      key={optionValue}
                      className="font-medium whitespace-nowrap"
                      initial={{ opacity: 0, scaleX: 0.8 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      style={{ originX: 0 }}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ToggleSwitch;
