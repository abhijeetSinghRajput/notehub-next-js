import { useRef, useEffect, useCallback, useMemo } from "react";

type DebouncedFn<TArgs extends unknown[]> = ((...args: TArgs) => void) & {
  cancel: () => void;
};

export function useDebounceCallback<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay = 300,
): DebouncedFn<TArgs> {
  const fnRef = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return useMemo(() => {
    const debounced = ((...args: TArgs) => {
      cancel();
      timerRef.current = setTimeout(() => {
        fnRef.current(...args);
      }, delay);
    }) as DebouncedFn<TArgs>;

    // Assign once, at creation time (no mutation of hook return value)
    debounced.cancel = cancel;

    return debounced;
  }, [cancel, delay]);
}