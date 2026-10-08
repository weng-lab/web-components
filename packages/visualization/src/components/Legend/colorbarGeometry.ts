import { blueGrey } from "@mui/material/colors";
import type { Theme } from "@mui/material/styles";

/** How ColorbarGraphic lies across its bar: kept apart so a caller can set room for it. */
export type ColorbarOrientation = "horizontal" | "vertical";

export const BAR = 10;
export const GAP = 2;
/** The histogram's depth: held to a chip row's 24px lying down, roomier standing up beside a heatmap. */
export const HISTOGRAM = { horizontal: 12, vertical: 16 } as const;

/** How much room the graphic takes across the bar: histogram, gap and bar. */
export const colorbarDepth = (orientation: ColorbarOrientation) => HISTOGRAM[orientation] + GAP + BAR;

/**
 * The slanted cut through a capped column, as polygon points: `from` to `to` across the column,
 * centered `at` along it, climbing `rise` with thickness `gap`. `place` maps those onto the screen.
 */
export const breakPoints = (
  place: (across: number, up: number) => [number, number],
  { from, to, at, rise, gap }: { from: number; to: number; at: number; rise: number; gap: number }
) =>
  [
    place(from, at - rise / 2 - gap / 2),
    place(to, at + rise / 2 - gap / 2),
    place(to, at + rise / 2 + gap / 2),
    place(from, at - rise / 2 + gap / 2),
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(" ");

/** Room between a bar and the end label beside it. */
export const LABEL_GAP = 8;

/** Room above and below a standing bar for its end labels, in a font this size. */
export const labelSpace = (fontSize: number) => fontSize + 7;

/**
 * The histogram's columns: neutral, so they read as counts rather than as part of the ramp, and a
 * slate that shows on the theme's paper, light or dark.
 */
export const columnColor = (theme: Theme) => (theme.palette.mode === "dark" ? blueGrey[300] : blueGrey[700]);
