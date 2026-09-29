import type { HeatmapProps } from "./types";

export const TICK_FONT_SIZE = 12;
export const TICK_FONT_FAMILY = "sans-serif";
export const AXIS_TITLE_FONT_SIZE = 14;

export const makeTickFormat = (names: string[]) => (d: number | { valueOf(): number }) => names[Math.floor(+d)] ?? "";

type XLabelOrientation = NonNullable<HeatmapProps["xLabelOrientation"]>;

const xTickAngleFor = (xLabelOrientation: XLabelOrientation) =>
  xLabelOrientation === "horizontal" ? 0 : xLabelOrientation === "vertical" ? -90 : xLabelOrientation === "leftDiagonal" ? -45 : 45;

const xTickTextAnchorFor = (xLabelOrientation: XLabelOrientation): "middle" | "start" | "end" =>
  xLabelOrientation === "horizontal" ? "middle" : xLabelOrientation === "rightDiagonal" ? "start" : "end";

export const getXAxisTickLabelProps = (xLabelOrientation: XLabelOrientation) => ({
  fontSize: TICK_FONT_SIZE,
  fontFamily: TICK_FONT_FAMILY,
  textAnchor: xTickTextAnchorFor(xLabelOrientation),
  angle: xTickAngleFor(xLabelOrientation),
  dy: xLabelOrientation === "horizontal" ? "0.71em" : "0.25em",
});

export const yAxisTickLabelProps = {
  fontSize: TICK_FONT_SIZE,
  fontFamily: TICK_FONT_FAMILY,
  textAnchor: "end" as const,
  dx: "-0.25em",
  dy: "0.25em",
};

/**
 * Tick label props that bold the labels of `marked` columns or rows (see selectionMarks). A tick's
 * value is its index plus a half, the middle of its cell.
 */
export const markTickLabels = <P extends object>(props: P, marked: Set<number>) =>
  marked.size === 0
    ? props
    : (value: number | { valueOf(): number }) => ({ ...props, fontWeight: marked.has(Math.floor(+value)) ? 700 : 400 });
