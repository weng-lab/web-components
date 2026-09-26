import { scaleLinear } from "@visx/scale";
import type { HeatmapCellId } from "./types";

export const DEFAULT_DESELECTED_COLOR = "#d1d5db";
export const DESELECTED_OPACITY = 0.5;
/** A cell outside highlightRange: faint enough that the cells inside it carry the grid. */
export const DIMMED_OPACITY = 0.12;
export const NULL_VALUE_COLOR = "none";

export const cellKey = (cell: HeatmapCellId) => `${cell.row}-${cell.column}`;

export function getHeatmapColorScale(colors: [string, string, ...string[]], domain: [number, number]) {
  const [minValue, maxValue] = domain;
  return scaleLinear<string>({
    range: colors,
    domain: colors.map((_, i) => minValue + (i * (maxValue - minValue)) / (colors.length - 1)),
    // Held at the end colors rather than extrapolated past them, which interpolates the RGB channels
    // out of range into colors that aren't on the gradient at all.
    clamp: true,
  });
}

/** Whether a count falls outside highlightRange, and so fades. Nothing fades without a range. */
export const isOutsideRange = (count: number | null | undefined, range: [number, number] | null | undefined) =>
  !!range && count != null && (count < range[0] || count > range[1]);

/**
 * Shared by the SVG cell renderer (HeatmapCells.tsx, used for non-scrollable mode and export)
 * and the canvas cell renderer (HeatmapCanvasCells.ts, used on-screen in scrollable mode) so the
 * two can never drift apart on what a cell actually looks like.
 */
export function resolveCellAppearance(
  count: number | null | undefined,
  color: string | undefined,
  isDeselected: boolean,
  deselectedColor: string,
  isDimmed = false
): { fill: string; fillOpacity: number } {
  const isNullValue = count == null;
  return {
    fill: isNullValue ? NULL_VALUE_COLOR : isDeselected ? deselectedColor : color ?? deselectedColor,
    fillOpacity: isNullValue ? 0 : (isDeselected ? DESELECTED_OPACITY : 1) * (isDimmed ? DIMMED_OPACITY : 1),
  };
}
