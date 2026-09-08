import { useMemo, useCallback } from "react";
import { scaleLinear } from "@visx/scale";
import { ScaleLinear } from "@visx/vendor/d3-scale";
import type { ColumnDatum, HeatmapCellId } from "./types";
import type { HeatmapProps } from "./types";
import { measureTextWidth } from "../../utility";
import { getHeatmapLegendWidth } from "./HeatmapLegend";
import { DEFAULT_DESELECTED_COLOR, cellKey, getHeatmapColorScale } from "./heatmapCellAppearance";
import { type CanvasCellParams } from "./HeatmapCanvasCells";
import { TICK_FONT_SIZE, TICK_FONT_FAMILY } from "./heatmapAxisProps";

export const LEGEND_GAP = 16;
// Extra breathing room between the tick labels and the axis title, beyond the space
// reserved for the tick labels themselves.
export const AXIS_LABEL_GAP = 12;
// Space reserved for the axis title itself (the "X-Axis Label" / "Y-Axis Label" text), beyond
// the tick labels. In scrollable mode this is carved out into its own always-visible pane so
// the title can't be scrolled out of view - see yTitleWidth/xTitleHeight in HeatmapLayout.
export const Y_AXIS_TITLE_SPACE = 40;
export const X_AXIS_TITLE_SPACE = 70;
// Canvas's measureText and the browser's actual SVG text layout don't agree to the sub-pixel,
// and the gap widens with string length - pad generously so long tick labels aren't clipped.
export const TICK_LABEL_WIDTH_SAFETY_FACTOR = 1.15;
export const MINI_MAP_HEIGHT = 50;

export const getBins = (d: ColumnDatum) => d.rows;

export function maxOf<Datum>(data: Datum[], value: (d: Datum) => number | null): number {
  // Null counts are gaps in the data and don't participate in the max. reduce rather than
  // Math.max(...spread): returns 0 (not -Infinity) for empty/all-null input, with no
  // argument-count ceiling.
  return data.reduce((max, datum) => {
    const datumValue = value(datum);
    return datumValue == null ? max : Math.max(max, datumValue);
  }, 0);
}

export interface HeatmapLayout {
  allColNames: string[];
  allRowNames: string[];
  numRows: number;
  minValue: number;
  maxValue: number;
  marg: { top: number; right: number; bottom: number; left: number };
  xMax: number;
  yMax: number;
  viewportWidth: number;
  viewportHeight: number;
  yTitleWidth: number;
  yTickLabelWidth: number;
  xTitleHeight: number;
  xTickLabelHeight: number;
  binWidth: number;
  binHeight: number;
  colLabelHeight: number;
  xTickLeftOverhangMax: number;
  maxRowNameWidth: number;
  legendWidth: number;
  xScale: ScaleLinear<number, number, never>;
  yScale: ScaleLinear<number, number, never>;
  cellYScale: (row: number) => number;
  xTickValues: number[];
  yTickValues: number[];
  stableColors: [string, string, ...string[]];
  colorScale: (count: number) => string | undefined;
  canvasCellParams: CanvasCellParams;
}

export interface UseHeatmapLayoutArgs {
  data: ColumnDatum[];
  colorDomain?: [number, number];
  colors: [string, string, ...string[]];
  xLabelOrientation: NonNullable<HeatmapProps["xLabelOrientation"]>;
  margin?: { top: number; right: number; bottom: number; left: number };
  showLegend: boolean;
  isScrollable: boolean;
  cellWidth?: number;
  cellHeight?: number;
  parentWidth: number;
  parentHeight: number;
  showMiniMap: boolean;
  gap: number;
  isRect: boolean;
  selectedCells?: HeatmapCellId[];
  deselectedColor?: string;
}

export function useHeatmapLayout({
  data, colorDomain, colors, xLabelOrientation, margin, showLegend, isScrollable,
  cellWidth, cellHeight, parentWidth, parentHeight, showMiniMap, gap, isRect,
  selectedCells, deselectedColor,
}: UseHeatmapLayoutArgs): HeatmapLayout {
  const allColNames = useMemo(() => data.map((d) => d.columnName), [data]);
  const allRowNames = useMemo(() => data[0]?.rows.map((r) => r.rowName) ?? [], [data]);
  const dataMaxValue = useMemo(() => maxOf(data, (d) => maxOf(getBins(d), (r) => r.count)), [data]);
  const [minValue, maxValue] = colorDomain ?? [0, dataMaxValue];
  const numRows = useMemo(() => maxOf(data, (d) => getBins(d).length), [data]);

  // Measured (not estimated) pixel width of the longest label, so any label - short or long,
  // narrow or wide characters - gets exactly the room it needs rather than a per-character guess.
  const maxColNameWidth = useMemo(
    () => allColNames.reduce((m, name) => Math.max(m, measureTextWidth(name, TICK_FONT_SIZE, TICK_FONT_FAMILY)), 0) * TICK_LABEL_WIDTH_SAFETY_FACTOR,
    [allColNames]
  );
  const maxRowNameWidth = useMemo(
    () => allRowNames.reduce((m, name) => Math.max(m, measureTextWidth(name, TICK_FONT_SIZE, TICK_FONT_FAMILY)), 0) * TICK_LABEL_WIDTH_SAFETY_FACTOR,
    [allRowNames]
  );

  const rotatedColNameSpace = maxColNameWidth;
  const colLabelHeight = xLabelOrientation === "horizontal" ? 12 : xLabelOrientation === "vertical" ? rotatedColNameSpace : rotatedColNameSpace * Math.SQRT1_2;

  const xTickLeftOverhangMax = xLabelOrientation === "leftDiagonal" ? colLabelHeight : 0;

  const colorsKey = colors.join("\u0000");
  const stableColors = useMemo(
    () => colorsKey.split("\u0000") as [string, string, ...string[]],
    [colorsKey]
  );

  const legendWidth = useMemo(() => getHeatmapLegendWidth(minValue, maxValue), [minValue, maxValue]);
  const defaultRight = showLegend ? legendWidth + LEGEND_GAP : 10;
  const defaultTop = 20;
  const labelBottomSpace = colLabelHeight + AXIS_LABEL_GAP + X_AXIS_TITLE_SPACE;
  const marg = margin ?? {
    top: defaultTop,
    left: maxRowNameWidth + AXIS_LABEL_GAP + Y_AXIS_TITLE_SPACE,
    right: defaultRight,
    bottom: labelBottomSpace + TICK_FONT_SIZE,
  };

  const miniMapSpace = isScrollable && showMiniMap ? MINI_MAP_HEIGHT : 0;
  const availableWidth = Math.max(0, parentWidth - marg.left - marg.right);
  const availableHeight = Math.max(0, parentHeight - marg.bottom - marg.top - miniMapSpace);

  const xMax = isScrollable ? data.length * (cellWidth as number) : availableWidth;
  const yMax = isScrollable ? numRows * (cellHeight as number) : availableHeight;
  const viewportWidth = isScrollable ? Math.min(xMax, availableWidth) : xMax;
  const viewportHeight = isScrollable ? Math.min(yMax, availableHeight) : yMax;

  const yTitleWidth = Y_AXIS_TITLE_SPACE;
  const yTickLabelWidth = Math.max(0, marg.left - yTitleWidth);
  const xTitleHeight = X_AXIS_TITLE_SPACE;
  const xTickLabelHeight = Math.max(0, marg.bottom - xTitleHeight);

  const binWidth = xMax / data.length;
  const binHeight = yMax / numRows;

  const xScale = useMemo(
    () => scaleLinear<number>({ domain: [0, data.length], range: [0, xMax] }),
    [data.length, xMax]
  );
  const yScale = useMemo(
    () => scaleLinear<number>({ domain: [0, numRows], range: [yMax, 0] }),
    [numRows, yMax]
  );
  const cellYScale = useCallback((row: number) => yScale(row + 1), [yScale]);

  const xTickValues = useMemo(() => data.map((_, i) => i + 0.5), [data]);
  const yTickValues = useMemo(() => data[0]?.rows.map((_, i) => i + 0.5) ?? [], [data]);

  const resolvedDeselectedColor = deselectedColor ?? DEFAULT_DESELECTED_COLOR;
  const colorScale = useMemo(
    () => getHeatmapColorScale(stableColors, [minValue, maxValue]),
    [stableColors, minValue, maxValue]
  );
  const selectedKeys = useMemo(
    () => (selectedCells?.length ? new Set(selectedCells.map(cellKey)) : null),
    [selectedCells]
  );

  // Everything the canvas draw loop and hit-testing need to place/color a cell. Only changes when
  // a prop that actually affects appearance/geometry changes - never on scroll or hover, so
  // drawCanvas (and, through it, handleGridScroll) keeps a stable identity across scroll events.
  const canvasCellParams: CanvasCellParams = useMemo(
    () => ({
      data, numRows, xScale, cellYScale, colorScale, gap, isRect, binWidth, binHeight,
      yMax, selectedKeys, deselectedColor: resolvedDeselectedColor,
    }),
    [data, numRows, xScale, cellYScale, colorScale, gap, isRect, binWidth, binHeight, yMax, selectedKeys, resolvedDeselectedColor]
  );

  return {
    allColNames, allRowNames, numRows, minValue, maxValue, marg, xMax, yMax,
    viewportWidth, viewportHeight, yTitleWidth, yTickLabelWidth, xTitleHeight, xTickLabelHeight,
    binWidth, binHeight, colLabelHeight, xTickLeftOverhangMax, maxRowNameWidth, legendWidth,
    xScale, yScale, cellYScale, xTickValues, yTickValues, stableColors, colorScale, canvasCellParams,
  };
}
