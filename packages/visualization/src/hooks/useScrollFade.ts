import { useEffect } from "react";
import { useStableCallback } from "./useStableCallback";

/** How far a scroller's contents fade out at an end with more past it, in px. ui-components' ScrollableTabs fades the same. */
const FADE = 18;

/** Whether there's more of a scroller's contents past each end. */
export type ScrollEnds = { start: boolean; end: boolean };

/**
 * A scroller's mask, fading its contents out at an end with more past it, kept in step by useScrollFade. `inset` is
 * room at the start held under something laid over the scroller, as a pinned axis, which the fade starts past.
 */
export const scrollFadeMask = (axis: "x" | "y", inset = 0) => {
  const fade = `linear-gradient(to ${axis === "x" ? "right" : "bottom"}, transparent ${inset}px, #000 calc(${inset}px + var(--fade-start, 0px)), #000 calc(100% - var(--fade-end, 0px)), transparent 100%)`;
  // Keeps a scrollbar the window shows clear of the fade.
  const scrollbar = `linear-gradient(#000, #000) 100% 100% / ${axis === "x" ? "100% var(--scrollbar-size, 0px)" : "var(--scrollbar-size, 0px) 100%"} no-repeat`;
  const mask = `${fade}, ${scrollbar}`;
  return { mask, WebkitMask: mask };
};

/**
 * Keeps scrollFadeMask's fade in step with how far `scroller` is scrolled along `axis`, as it scrolls and as it or its
 * contents resize. `onEnds` hears whether there's more past each end, as that changes.
 */
export function useScrollFade(
  scroller: HTMLElement | null,
  axis: "x" | "y",
  { depth = FADE, onEnds }: { depth?: number; onEnds?: (ends: ScrollEnds) => void } = {}
) {
  const handleEnds = useStableCallback(onEnds);

  useEffect(() => {
    if (!scroller) return;
    let ends: ScrollEnds | undefined;
    const update = () => {
      const x = axis === "x";
      const before = x ? scroller.scrollLeft : scroller.scrollTop;
      const after = x
        ? scroller.scrollWidth - scroller.clientWidth - before
        : scroller.scrollHeight - scroller.clientHeight - before;
      // Read before anything's written, so writing doesn't force a layout to read.
      const scrollbar = x ? scroller.offsetHeight - scroller.clientHeight : scroller.offsetWidth - scroller.clientWidth;
      // Each fade deepens over the first `depth` px scrolled from its end, rather than appearing at once. Set straight on
      // the element, so scrolling doesn't re-render what's in it.
      scroller.style.setProperty("--fade-start", `${Math.min(Math.max(before, 0), depth)}px`);
      scroller.style.setProperty("--fade-end", `${Math.min(Math.max(after, 0), depth)}px`);
      scroller.style.setProperty("--scrollbar-size", `${scrollbar}px`);
      const start = before > 1;
      const end = after > 1;
      if (ends?.start !== start || ends?.end !== end) {
        ends = { start, end };
        handleEnds(ends);
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    // Its contents, which grow and shrink inside it.
    Array.from(scroller.children).forEach((child) => observer.observe(child));
    scroller.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", update);
    };
  }, [scroller, axis, depth, handleEnds]);
}
