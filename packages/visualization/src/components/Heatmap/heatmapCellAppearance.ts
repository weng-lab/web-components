import { scaleLinear } from "@visx/scale";
import type { HeatmapCellId } from "./types";

export const DEFAULT_DESELECTED_COLOR = "#d1d5db";
export const DESELECTED_OPACITY = 0.5;
export const NULL_VALUE_COLOR = "none";

export const cellKey = (cell: HeatmapCellId) => `${cell.row}-${cell.column}`;

export function getHeatmapColorScales(colors: [string, string, ...string[]], maxValue: number) {
  const colorScale = scaleLinear<string>({
    range: colors,
    domain: colors.map((_, i) => (i * maxValue) / (colors.length - 1)),
  });
  const opacityScale = scaleLinear<number>({ range: [0.5, 1], domain: [0.5, maxValue] });
  return { colorScale, opacityScale };
}

/**
 * Shared by the SVG cell renderer (HeatmapCells.tsx, used for non-scrollable mode and export)
 * and the canvas cell renderer (HeatmapCanvasCells.ts, used on-screen in scrollable mode) so the
 * two can never drift apart on what a cell actually looks like.
 */
export function resolveCellAppearance(
  count: number | null | undefined,
  color: string | undefined,
  opacity: number | undefined,
  isDeselected: boolean,
  deselectedColor: string
): { fill: string; fillOpacity: number } {
  const isNullValue = count == null;
  return {
    fill: isNullValue ? NULL_VALUE_COLOR : isDeselected ? deselectedColor : color ?? deselectedColor,
    fillOpacity: isNullValue ? 0 : isDeselected ? DESELECTED_OPACITY : opacity ?? 1,
  };
}
