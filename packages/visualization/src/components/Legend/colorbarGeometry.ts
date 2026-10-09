import { blueGrey } from "@mui/material/colors";
import type { Theme } from "@mui/material/styles";

/** Which way a colorbar's bar runs. */
export type ColorbarOrientation = "horizontal" | "vertical";

export const BAR = 10;
export const GAP = 2;
/** The histogram's depth: held to a chip row's 24px lying down, roomier standing up beside a heatmap. */
export const HISTOGRAM = { horizontal: 12, vertical: 16 } as const;

/** How much room the graphic takes across the bar: histogram, gap and bar. */
export const colorbarDepth = (orientation: ColorbarOrientation) => HISTOGRAM[orientation] + GAP + BAR;

/**
 * Each histogram column's height, out of `depth`. The end columns also count the values beyond the
 * range and can dwarf the rest, so heights are scaled to the tallest middle column, and a taller end
 * column is `capped`, to be drawn with a break (see breakPoints).
 */
export const histogramColumns = (counts: readonly number[], depth: number) => {
  const tallest = Math.max(1, ...counts.slice(1, -1));
  return counts.map((count) => ({
    count,
    size: Math.max(1, Math.min(count / tallest, 1) * depth),
    capped: count > tallest,
  }));
};

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
