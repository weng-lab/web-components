import type React from "react";

export type Direction = "row" | "column";
export type ResponsiveDirection = Direction | Partial<Record<"xs" | "sm" | "md" | "lg" | "xl", Direction>>;

export type ResizablePanesProps = {
  /** Content for the left (row mode) / top (column mode) pane. */
  first: React.ReactNode;
  /** Content for the right (row mode) / bottom (column mode) pane. */
  second: React.ReactNode;
  /**
   * Layout direction. A string forces the direction; an object maps breakpoints
   * to directions and compiles to CSS `@media` rules via MUI's `sx` cascade (each
   * breakpoint applies from its key upward). If the map omits `xs`, the base case
   * is back-filled from the lowest defined breakpoint.
   * @default "row"
   */
  direction?: ResponsiveDirection;
  /**
   * Initial width of the first pane as a percentage of the container.
   * @default 50
   */
  initialPct?: number;
  /**
   * Minimum width (%) the first pane can be dragged to.
   * @default 20
   */
  min?: number;
  /**
   * Maximum width (%) the first pane can be dragged to.
   * @default 80
   */
  max?: number;
  /** Collapse one pane, rendering the other full-width and hiding the divider. */
  collapsed?: "first" | "second";
  /**
   * Pane height when laid out side-by-side (row mode).
   * @default "max(60vh, 600px)"
   */
  rowHeight?: string;
  /**
   * Pane height when stacked (column mode).
   * @default "500px"
   */
  columnHeight?: string;
  /**
   * Spacing (theme units) used for the divider column in row mode and the gap
   * between stacked panes in column mode.
   * @default 2
   */
  gap?: number;
  /** Override the default drag-handle rendered inside the divider. */
  dividerContent?: React.ReactNode;
};
