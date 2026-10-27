import { RefObject, useEffect, useState } from "react";

/** How far one finger moves over the plot before it's taken as trying to move the plot. */
const DRAG = 12;
/** How long the hint stays once the finger lifts. */
const LINGER = 1200;

/**
 * Whether to show a plot's TwoFingerHint: while one finger drags across `ref`, scrolling the page
 * rather than the plot, and briefly after, as embedded maps do. A second finger hides it.
 */
export function useTwoFingerHint(ref: RefObject<Element | null>, enabled = true) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current as HTMLElement | null;
    if (!element || !enabled) return;
    let start: { x: number; y: number } | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const handleStart = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        start = null;
        clearTimeout(timer);
        setShown(false);
        return;
      }
      start = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    };
    const handleMove = (event: TouchEvent) => {
      if (!start || event.touches.length !== 1) return;
      const { clientX, clientY } = event.touches[0];
      if (Math.hypot(clientX - start.x, clientY - start.y) < DRAG) return;
      clearTimeout(timer);
      setShown(true);
    };
    const handleEnd = (event: TouchEvent) => {
      if (event.touches.length) return;
      start = null;
      clearTimeout(timer);
      timer = setTimeout(() => setShown(false), LINGER);
    };

    element.addEventListener("touchstart", handleStart, { passive: true });
    element.addEventListener("touchmove", handleMove, { passive: true });
    element.addEventListener("touchend", handleEnd);
    element.addEventListener("touchcancel", handleEnd);
    return () => {
      clearTimeout(timer);
      element.removeEventListener("touchstart", handleStart);
      element.removeEventListener("touchmove", handleMove);
      element.removeEventListener("touchend", handleEnd);
      element.removeEventListener("touchcancel", handleEnd);
    };
  }, [ref, enabled]);

  return enabled && shown;
}
