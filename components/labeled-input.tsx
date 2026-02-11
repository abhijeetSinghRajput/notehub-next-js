import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LabeledInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  showPasswordToggle?: boolean;
  loading?: boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  rightElement?: React.ReactNode;
}

export const LabeledInput = React.forwardRef<
  HTMLInputElement,
  LabeledInputProps
>(({
  id,
  label,
  type = "text",
  error,
  showPasswordToggle = false,
  loading = false,
  className,
  inputClassName,
  labelClassName,
  rightElement,
  disabled,
  value,
  placeholder,
  onChange,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const inputType =
    showPasswordToggle ? (showPassword ? "text" : "password") : type;

  return (
    <div className={cn("grid items-center gap-1", className)}>
      <div className="relative">
        <Label
          htmlFor={id}
          className={cn(
            "absolute top-2 left-3 text-sm font-normal text-muted-foreground",
            labelClassName
          )}
        >
          {label}
        </Label>

        <Input
          ref={ref}
          id={id}
          type={inputType}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            "pt-7 text-base h-auto rounded-lg transition-all",
            (showPasswordToggle || rightElement) && "pr-12",
            !placeholder && !value && "pt-3 focus-visible:pt-7",
            inputClassName
          )}
          {...props}
        />

        {loading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}

        {showPasswordToggle && !loading && (
          <Button
            type="button"
            variant="ghost"
            className="absolute right-0 top-1/2 h-full -translate-y-1/2 aspect-square p-1 hover:bg-transparent"
            onClick={() => setShowPassword((p) => !p)}
            tabIndex={-1}
          >
            {showPassword ? (
              <Eye className="size-4" />
            ) : (
              <EyeOff className="size-4" />
            )}
          </Button>
        )}

        {rightElement && !loading && !showPasswordToggle && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
});

LabeledInput.displayName = "LabeledInput";
