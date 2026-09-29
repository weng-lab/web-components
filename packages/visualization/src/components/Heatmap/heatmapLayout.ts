import { useMemo, useCallback } from "react";
import { scaleLinear } from "@visx/scale";
import { ScaleLinear } from "@visx/vendor/d3-scale";
import type { ColumnDatum, HeatmapCellId, HeatmapProps } from "./types";
import { measureTextWidth } from "../../utility";
import { getHeatmapLegendWidth } from "./HeatmapLegend";
import { getHeatmapColorScale } from "./heatmapCellAppearance";
import { cellKey, selectionMarks as markSelection, type SelectionMarks } from "./heatmapSelection";
import { type CanvasCellParams } from "./HeatmapCanvasCells";
import { AXIS_TITLE_FONT_SIZE, TICK_FONT_SIZE, TICK_FONT_FAMILY } from "./heatmapAxisProps";

export const LEGEND_GAP = 16;
// Between the tick labels and the axis title.
const AXIS_LABEL_GAP = 12;
// Each axis title's pane, which stays put as the grid scrolls.
const Y_AXIS_TITLE_SPACE = 40;
const X_AXIS_TITLE_SPACE = 70;
// measureText and SVG text layout disagree slightly, more so for long labels: pad so none get clipped.
const TICK_LABEL_WIDTH_SAFETY_FACTOR = 1.15;
export const MINI_MAP_HEIGHT = 50;

/**
 * Where to center the x-axis title: at `plotCenter`, pulled in to stay inside `canvasWidth`, which
 * a plot of a column or two can be narrower than the title.
 */
export function xAxisTitleCenter(title: string, plotCenter: number, canvasWidth: number): number {
  const titleWidth = measureTextWidth(title, AXIS_TITLE_FONT_SIZE, TICK_FONT_FAMILY) * TICK_LABEL_WIDTH_SAFETY_FACTOR;
  if (titleWidth >= canvasWidth) return canvasWidth / 2;
  return Math.min(Math.max(plotCenter, titleWidth / 2), canvasWidth - titleWidth / 2);
}

// Skips nulls, and is 0 with no values. A reduce, as Math.max(...values) has an argument limit.
function maxOf<Datum>(data: Datum[], value: (d: Datum) => number | null): number {
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
  xTickLeftOverhangMax: number;
  legendWidth: number;
  xScale: ScaleLinear<number, number, never>;
  yScale: ScaleLinear<number, number, never>;
  xTickValues: number[];
  yTickValues: number[];
  stableColors: [string, string, ...string[]];
  /** Everything a cell's placement and color depend on, for drawing and hit-testing. */
  canvasCellParams: CanvasCellParams;
  selectionMarks: SelectionMarks;
}

export interface UseHeatmapLayoutArgs {
  data: ColumnDatum[];
  colorDomain?: [number, number];
  colors: [string, string, ...string[]];
  xLabelOrientation: NonNullable<HeatmapProps["xLabelOrientation"]>;
  margin?: { top: number; right: number; bottom: number; left: number };
  showLegend: boolean;
  cellWidth?: number;
  cellHeight?: number;
  parentWidth: number;
  parentHeight: number;
  showMiniMap: boolean;
  gap: number;
  isRect: boolean;
  selectedCells?: HeatmapCellId[];
  highlightRange?: [number, number] | null;
  /** A custom legend's width, in place of the built-in legend's. */
  legendWidth?: number;
}

export function useHeatmapLayout({
  data, colorDomain, colors, xLabelOrientation, margin, showLegend,
  cellWidth, cellHeight, parentWidth, parentHeight, showMiniMap, gap, isRect,
  selectedCells, highlightRange, legendWidth: customLegendWidth,
}: UseHeatmapLayoutArgs): HeatmapLayout {
  const allColNames = useMemo(() => data.map((d) => d.columnName), [data]);
  const allRowNames = useMemo(() => data[0]?.rows.map((r) => r.rowName) ?? [], [data]);
  const dataMaxValue = useMemo(() => maxOf(data, (d) => maxOf(d.rows, (r) => r.count)), [data]);
  const [minValue, maxValue] = colorDomain ?? [0, dataMaxValue];
  const numRows = useMemo(() => maxOf(data, (d) => d.rows.length), [data]);

  // The longest labels, measured rather than estimated from their length.
  const maxColNameWidth = useMemo(
    () => allColNames.reduce((m, name) => Math.max(m, measureTextWidth(name, TICK_FONT_SIZE, TICK_FONT_FAMILY)), 0) * TICK_LABEL_WIDTH_SAFETY_FACTOR,
    [allColNames]
  );
  const maxRowNameWidth = useMemo(
    () => allRowNames.reduce((m, name) => Math.max(m, measureTextWidth(name, TICK_FONT_SIZE, TICK_FONT_FAMILY)), 0) * TICK_LABEL_WIDTH_SAFETY_FACTOR,
    [allRowNames]
  );

  const colLabelHeight = xLabelOrientation === "horizontal" ? 12 : xLabelOrientation === "vertical" ? maxColNameWidth : maxColNameWidth * Math.SQRT1_2;

  const xTickLeftOverhangMax = xLabelOrientation === "leftDiagonal" ? colLabelHeight : 0;

  const colorsKey = colors.join("\u0000");
  const stableColors = useMemo(
    () => colorsKey.split("\u0000") as [string, string, ...string[]],
    [colorsKey]
  );

  const builtInLegendWidth = useMemo(() => getHeatmapLegendWidth(minValue, maxValue), [minValue, maxValue]);
  const legendWidth = customLegendWidth ?? builtInLegendWidth;
  const defaultRight = showLegend ? legendWidth + LEGEND_GAP : 10;
  const defaultTop = 20;
  const labelBottomSpace = colLabelHeight + AXIS_LABEL_GAP + X_AXIS_TITLE_SPACE;
  const marg = margin ?? {
    top: defaultTop,
    left: maxRowNameWidth + AXIS_LABEL_GAP + Y_AXIS_TITLE_SPACE,
    right: defaultRight,
    bottom: labelBottomSpace + TICK_FONT_SIZE,
  };

  const miniMapSpace = showMiniMap ? MINI_MAP_HEIGHT : 0;
  const availableWidth = Math.max(0, parentWidth - marg.left - marg.right);
  const availableHeight = Math.max(0, parentHeight - marg.bottom - marg.top - miniMapSpace);

  // The whole grid: fixed-size cells where given, which scroll once they outgrow the space, and
  // otherwise cells sharing it.
  const xMax = cellWidth != null ? data.length * cellWidth : availableWidth;
  const yMax = cellHeight != null ? numRows * cellHeight : availableHeight;
  const viewportWidth = Math.min(xMax, availableWidth);
  const viewportHeight = Math.min(yMax, availableHeight);

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

  const colorScale = useMemo(
    () => getHeatmapColorScale(stableColors, [minValue, maxValue]),
    [stableColors, minValue, maxValue]
  );
  const selectedKeys = useMemo(
    () => (selectedCells?.length ? new Set(selectedCells.map(cellKey)) : null),
    [selectedCells]
  );
  const selectionMarks = useMemo(
    () => markSelection(selectedKeys, data.length, numRows),
    [selectedKeys, data.length, numRows]
  );

  // Kept by value, so a caller passing a fresh [min, max] literal on each render doesn't repaint.
  const [highlightMin, highlightMax] = highlightRange ?? [];
  const stableHighlightRange = useMemo<[number, number] | null>(
    () => (highlightMin === undefined || highlightMax === undefined ? null : [highlightMin, highlightMax]),
    [highlightMin, highlightMax]
  );

  // Changes only with the cells' appearance or geometry, never on scroll or hover, so drawCanvas
  // keeps its identity while scrolling.
  const canvasCellParams: CanvasCellParams = useMemo(
    () => ({
      data, numRows, xScale, cellYScale, colorScale, minValue, maxValue, gap, isRect, binWidth, binHeight,
      yMax, selectedKeys, selectionMarks, highlightRange: stableHighlightRange,
    }),
    [data, numRows, xScale, cellYScale, colorScale, minValue, maxValue, gap, isRect, binWidth, binHeight, yMax, selectedKeys, selectionMarks, stableHighlightRange]
  );

  return {
    allColNames, allRowNames, numRows, minValue, maxValue, marg, xMax, yMax,
    viewportWidth, viewportHeight, yTitleWidth, yTickLabelWidth, xTitleHeight, xTickLabelHeight,
    binWidth, xTickLeftOverhangMax, legendWidth,
    xScale, yScale, xTickValues, yTickValues, stableColors, canvasCellParams, selectionMarks,
  };
}
