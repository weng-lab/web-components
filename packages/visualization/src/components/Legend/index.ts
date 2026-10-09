/**
 * Legends a plot can sit beside: chips for groups, and a colorbar for a continuous value, with the
 * button that moves where its colors stop. A page wires a legend's hover and toggles to its plot.
 */

export { default as ChipLegend } from "./ChipLegend/ChipLegend";
export type { ChipLegendProps, LegendGroup } from "./ChipLegend/ChipLegend";

export { Colorbar } from "./Colorbar/Colorbar";
export type { ColorbarProps, ColorbarScaleProps } from "./Colorbar/Colorbar";
export { default as ColorbarLegend } from "./Colorbar/ColorbarLegend";
export type { ColorbarLegendProps } from "./Colorbar/ColorbarLegend";
export { themeLabelStyle } from "./Colorbar/colorbarLabels";
export type { ColorbarLabelStyle } from "./Colorbar/colorbarLabels";
export { default as ColorRangeButton } from "./ColorRange/ColorRangeButton";
export type { ColorRangeButtonProps, ColorRangeControl } from "./ColorRange/ColorRangeButton";
export {
  evenStops,
  percentilePresets,
  percentileRange,
  rampColor,
  reachOf,
  sameRange,
  sweptValues,
  symmetricPresets,
} from "./colorbarAxis";
export type { ColorRange, RampKind, RampRange, RampStop, RangePreset } from "./colorbarAxis";
