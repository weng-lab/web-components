import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { scrollFadeMask, useScrollFade } from "../hooks";

/** Deeper than a row's fade, so it shows over a plot's taller rows even where they break cleanly at the end. */
const FADE = 30;

export type PinnedAxisScrollerProps = {
  /** Gets the scroller: what the plot measures, so its width leaves out a scrollbar the window shows beside it. */
  scrollerRef: (node: HTMLDivElement | null) => void;
  /** The scroller, once mounted. */
  scroller: HTMLDivElement | null;
  /** Whether the rows scroll under the axis. Otherwise they're held in place, and the axis is left in the plot. */
  pinned: boolean;
  width: number;
  /** The axis's height, at the top of the plot. */
  axisHeight: number;
  /** The axis, placed as in the plot's svg, where its own copy is classed "pinned-axis". */
  axis: ReactNode;
  /** Dims the axis, as the plot dims while it settles. */
  opacity?: number;
  /** The plot's svg. */
  children: ReactNode;
};

/**
 * A plot's rows scrolling under its axis, which is drawn again outside the scroller so it never moves. The rows fade
 * at an end with more past them and are masked out under the axis, so it shows over any background. The plot's own
 * copy stays in its svg for downloads, hidden by a stylesheet rule they leave behind, so a phone's bounce past the
 * top pulls the rows from under this one. It takes no pointer events, so a wheel or swipe over it still scrolls the
 * rows. Placed in the plot's positioned container.
 */
export const PinnedAxisScroller = ({
  scrollerRef,
  scroller,
  pinned,
  width,
  axisHeight,
  axis,
  opacity,
  children,
}: PinnedAxisScrollerProps) => {
  useScrollFade(pinned ? scroller : null, "y", { depth: FADE });

  return (
    <>
      <Box
        ref={scrollerRef}
        sx={{
          position: "absolute",
          inset: 0,
          overflowX: "hidden",
          overflowY: pinned ? "auto" : "hidden",
          ...(pinned && {
            ...scrollFadeMask("y", axisHeight + 1),
            "& .pinned-axis": { visibility: "hidden" },
          }),
        }}
      >
        {children}
      </Box>
      {pinned && (
        <svg
          width={width}
          height={axisHeight + 1}
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", opacity }}
        >
          {axis}
        </svg>
      )}
    </>
  );
};
