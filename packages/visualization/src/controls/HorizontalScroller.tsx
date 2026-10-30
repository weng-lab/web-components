import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, IconButton, Stack } from "@mui/material";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { scrollFadeMask, useScrollFade, type ScrollEnds } from "../hooks";

/** How far a scroll button moves the row: most of its width, so an item stays in view for context. */
const PAGE = 0.8;
/** Room left beside an item scrolled into view. */
const EDGE = 8;

export type HorizontalScrollerProps = {
  children: ReactNode;
  /** What the row holds, for the scroll buttons' names: "Scroll the {label} left". */
  label?: string;
  /**
   * The `data-scroller-key` of an item to scroll into view. Left alone while the cursor is on the row,
   * where scrolling would pull the items from under it.
   */
  reveal?: string | null;
  /** Space between the items, in theme spacing. */
  gap?: number;
};

/**
 * One row that scrolls sideways, with buttons at either end while it overflows, as MUI's scrollable
 * Tabs, and the row fading out at an end with more past it. A vertical swipe over it still scrolls the
 * page. Takes the room its flex parent gives it.
 */
export const HorizontalScroller = ({ children, label = "row", reveal, gap = 0.5 }: HorizontalScrollerProps) => {
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const pointerInside = useRef(false);
  // Whether there's more of the row past each end.
  const [more, setMore] = useState<ScrollEnds>({ start: false, end: false });
  useScrollFade(scroller, "x", { onEnds: setMore });

  useEffect(() => {
    if (!scroller || reveal == null || pointerInside.current) return;
    const item = scroller.querySelector(`[data-scroller-key="${CSS.escape(reveal)}"]`);
    if (!item) return;
    const view = scroller.getBoundingClientRect();
    const { left, right } = item.getBoundingClientRect();
    const offset = left < view.left ? left - view.left - EDGE : right > view.right ? right - view.right + EDGE : 0;
    // A smooth scroll takes longer the further it goes, so a long jump is made at once rather than
    // trailing behind a cursor moving on across the plot.
    if (offset !== 0) {
      scroller.scrollBy({ left: offset, behavior: Math.abs(offset) > scroller.clientWidth ? "auto" : "smooth" });
    }
  }, [reveal, scroller]);

  const scrollButton = (direction: -1 | 1) => (
    <IconButton
      size="small"
      disabled={direction === -1 ? !more.start : !more.end}
      onClick={() => scroller?.scrollBy({ left: direction * scroller.clientWidth * PAGE, behavior: "smooth" })}
      aria-label={`Scroll the ${label} ${direction === -1 ? "left" : "right"}`}
      // A small chip's height, so the buttons appearing doesn't change a legend row's.
      sx={{ p: 0, width: 24, height: 24, flexShrink: 0 }}
    >
      {direction === -1 ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
    </IconButton>
  );
  const overflowing = more.start || more.end;

  return (
    <Stack direction="row" alignItems="center" gap={0.5} flex="1 1 auto" minWidth={0}>
      {overflowing && scrollButton(-1)}
      <Box
        ref={setScroller}
        onMouseEnter={() => (pointerInside.current = true)}
        onMouseLeave={() => (pointerInside.current = false)}
        sx={{
          flex: "1 1 auto",
          minWidth: 0,
          overflowX: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          // A mask rather than a gradient painted over the row, so the items themselves fade, over
          // whatever background the row sits on.
          ...scrollFadeMask("x"),
          // Room for an item's focus ring or outline, which the scroller would otherwise clip, without
          // adding to the row's height.
          p: "3px",
          my: "-3px",
        }}
      >
        <Stack direction="row" alignItems="center" gap={gap} width="max-content">
          {children}
        </Stack>
      </Box>
      {overflowing && scrollButton(1)}
    </Stack>
  );
};
