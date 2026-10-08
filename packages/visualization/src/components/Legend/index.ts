/**
 * Legends a plot can sit beside: chips for groups, and a colorbar for a continuous value, with the
 * button that moves where its colors stop. Plots don't draw these themselves; a page wires a legend's
 * hover and toggles to its plot.
 */

export { default as ChipLegend } from "./ChipLegend";
export type { ChipLegendProps, LegendGroup } from "./ChipLegend";
export { default as ShapeGlyph } from "./ShapeGlyph";
export type { ShapeGlyphProps } from "./ShapeGlyph";

export { Colorbar, InlineColorbar } from "./Colorbar";
export type { ColorbarProps, ColorbarScaleProps, InlineColorbarProps } from "./Colorbar";
export { default as ColorbarLegend } from "./ColorbarLegend";
export type { ColorbarLegendProps } from "./ColorbarLegend";
export { DEFAULT_LABEL_STYLE, themeLabelStyle } from "./colorbarLabels";
export type { ColorbarLabelStyle } from "./colorbarLabels";
export { default as ColorRangeButton } from "./ColorRangeButton";
export type { ColorRangeButtonProps, ColorRangeControl } from "./ColorRangeButton";
export { default as SteadyText } from "./SteadyText";
export {
  colorAt,
  evenStops,
  formatRange,
  percentile,
  percentilePresets,
  percentileRange,
  rangeAxis,
  reachOf,
  sameRange,
  sweptValues,
  symmetricPresets,
} from "./colorbarAxis";
export type { ColorRange, RampKind, RampRange, RampStop, RangePreset } from "./colorbarAxis";
