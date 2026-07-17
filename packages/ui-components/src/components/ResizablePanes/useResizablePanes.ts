import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

/** Percentage the first pane moves per arrow-key press. */
const KEYBOARD_STEP = 2;

/**
 * Drag-to-resize state for a split-pane layout. Returns the current first-pane
 * width (as a percentage), a setter, the container ref used to measure drag
 * position, and the handlers to spread onto the divider (pointer drag plus
 * arrow-key resize).
 */
export function useResizablePanes(initialPct = 50, min = 20, max = 80) {
  const [pct, setPct] = useState(initialPct);
  const containerRef = useRef<HTMLDivElement>(null);

  const clamp = useCallback((value: number) => Math.min(max, Math.max(min, value)), [min, max]);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newPct = ((e.clientX - rect.left) / rect.width) * 100;
      setPct(clamp(newPct));
    },
    [clamp]
  );

  const onPointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        setPct((p) => clamp(p - KEYBOARD_STEP));
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        setPct((p) => clamp(p + KEYBOARD_STEP));
        e.preventDefault();
      } else if (e.key === "Home") {
        setPct(min);
        e.preventDefault();
      } else if (e.key === "End") {
        setPct(max);
        e.preventDefault();
      }
    },
    [clamp, min, max]
  );

  return {
    pct,
    setPct,
    containerRef,
    dividerHandlers: { onPointerDown, onPointerMove, onPointerUp, onKeyDown },
  };
}
