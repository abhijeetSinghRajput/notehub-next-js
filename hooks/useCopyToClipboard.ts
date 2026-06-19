import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

type UseCopyToClipboardOptions = {
  duration?: number;
  successMessage?: string;
  errorMessage?: string;
};

export function useCopyToClipboard({
  duration = 3000,
  successMessage = "Copied to clipboard",
  errorMessage = "Failed to copy",
}: UseCopyToClipboardOptions = {}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const copy = useCallback(
    async (text: string, message?: string) => {
      try {
        await navigator.clipboard.writeText(text);

        setCopied(true);
        toast.success(message || successMessage);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, duration);

        return true;
      } catch {
        toast.error(errorMessage);
        return false;
      }
    },
    [duration, successMessage, errorMessage]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    copied,
    copy,
  };
}