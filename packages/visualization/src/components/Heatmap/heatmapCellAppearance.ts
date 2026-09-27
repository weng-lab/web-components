import { scaleLinear } from "@visx/scale";
import type { HeatmapCellId } from "./types";

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
 *
 * Selection doesn't touch a cell's own color: it is framed instead (see heatmapSelection.ts), so
 * the cells around a selection keep the colors a reader picks the next one out by.
 */
export function resolveCellAppearance(
  count: number | null | undefined,
  color: string | undefined,
  isDimmed = false
): { fill: string; fillOpacity: number } {
  const isNullValue = count == null;
  return {
    fill: isNullValue || color === undefined ? NULL_VALUE_COLOR : color,
    fillOpacity: isNullValue ? 0 : isDimmed ? DIMMED_OPACITY : 1,
  };
}
