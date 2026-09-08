import type { HeatmapProps } from "./types";

export const TICK_FONT_SIZE = 12;
export const TICK_FONT_FAMILY = "sans-serif";
export const AXIS_TITLE_FONT_SIZE = 14;

export const makeTickFormat = (names: string[]) => (d: number | { valueOf(): number }) => names[Math.floor(+d)] ?? "";

type XLabelOrientation = NonNullable<HeatmapProps["xLabelOrientation"]>;

export const xTickAngleFor = (xLabelOrientation: XLabelOrientation) =>
  xLabelOrientation === "horizontal" ? 0 : xLabelOrientation === "vertical" ? -90 : xLabelOrientation === "leftDiagonal" ? -45 : 45;

export const xTickTextAnchorFor = (xLabelOrientation: XLabelOrientation): "middle" | "start" | "end" =>
  xLabelOrientation === "horizontal" ? "middle" : xLabelOrientation === "rightDiagonal" ? "start" : "end";

export const getXAxisTickLabelProps = (xLabelOrientation: XLabelOrientation) => ({
  fontSize: TICK_FONT_SIZE,
  fontFamily: TICK_FONT_FAMILY,
  textAnchor: xTickTextAnchorFor(xLabelOrientation),
  angle: xTickAngleFor(xLabelOrientation),
  dy: xLabelOrientation === "horizontal" ? "0.71em" : "0.25em",
});

export const xAxisLabelProps = {
  fontSize: AXIS_TITLE_FONT_SIZE,
  fontFamily: TICK_FONT_FAMILY,
  textAnchor: "middle" as const,
  dy: "-0.5em",
};

export const yAxisTickLabelProps = {
  fontSize: TICK_FONT_SIZE,
  fontFamily: TICK_FONT_FAMILY,
  textAnchor: "end" as const,
  dx: "-0.25em",
  dy: "0.25em",
};

export const yAxisLabelProps = {
  fontSize: AXIS_TITLE_FONT_SIZE,
  fontFamily: TICK_FONT_FAMILY,
  textAnchor: "middle" as const,
};
