import { useEffect, useRef } from "react";
import { debounce } from "@mui/material/utils";

/**
 * Hook that monitors a container element's width changes and triggers a callback
 * when the width changes (debounced to avoid excessive calls).
 *
 * @param containerRef - Ref to the container element to monitor
 * @param callback - Function to call when width changes
 * @param debounceMs - Debounce delay in milliseconds (default: 200)
 */
export const useContainerResize = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  callback: () => void,
  debounceMs: number = 200
): void => {
  const prevWidth = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const debouncedResize = debounce(() => {
      const newWidth = container.offsetWidth;

      // ONLY trigger if the actual pixel width of the container changed.
      // This ignores cases where the grid content expands horizontally
      // but the container remains the same size.
      if (newWidth !== prevWidth.current) {
        prevWidth.current = newWidth;
        callback();
      }
    }, debounceMs);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use borderBoxSize for more accurate external boundary measurement
        if (entry.borderBoxSize) {
          debouncedResize();
        }
      }
    });

    observer.observe(container);

    return () => {
      debouncedResize.clear();
      observer.disconnect();
    };
  }, [containerRef, callback, debounceMs]);
};
