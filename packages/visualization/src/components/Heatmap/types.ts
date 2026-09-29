import { ReactElement, ReactNode } from "react";
import { DownloadPlotHandle, AnimationType } from "../../utility";
import { RectCell, CircleCell } from "@visx/heatmap";
import { ManualSizeProps } from "../../responsive";

export type RowDatum<R extends object = Record<string, unknown>> = {
    rowName: string;
    count: number | null;
    metadata?: R;
}

export type ColumnDatum<C extends object = Record<string, unknown>, R extends object = Record<string, unknown>> = {
    columnName: string;
    rows: RowDatum<R>[];
    metadata?: C
}

/**
 * Identifies a single cell by the row/column indices found on the bin passed to onClick
 * (bin.row, bin.column).
 */
export type HeatmapCellId = { row: number; column: number };

/** The box renderLegend draws in, and which way its bar runs. */
export type HeatmapLegendFrame = {
  width: number;
  height: number;
  /** "vertical" beside the grid; "horizontal" across the top of the expanded minimap. */
  orientation: "vertical" | "horizontal";
  /**
   * In the expanded minimap, the element a tooltip or other overlay must portal into to show above
   * it - e.g. MUI's `slotProps={{ popper: { container } }}`. Undefined beside the grid.
   */
  overlayContainer?: HTMLElement;
};

export type HeatmapProps<C extends object = Record<string, unknown>, R extends object = Record<string, unknown>> = ManualSizeProps & {
  data: ColumnDatum<C, R>[];
  //May need to pass in the optional type parameters here if the types are not properly inferred
  onClick?: (bin:  RectCell<ColumnDatum, RowDatum> | CircleCell<ColumnDatum, RowDatum>) => void;
  ref?: React.Ref<DownloadPlotHandle>;
  downloadFileName?: string;
  /**
   * Colors for the gradient. At least two required for the gradient, additional can be passed to define midpoints.
   */
  colors: [string, string, ...string[]]
  /**
   * Value range mapped across `colors`, evenly spaced. Defaults to [0, max value in data]. A count
   * beyond either end takes that end's color.
   */
  colorDomain?: [number, number];
  xLabel?: string;
  yLabel?: string;
  tooltipBody?: (bin:  RectCell<ColumnDatum, RowDatum> | CircleCell<ColumnDatum, RowDatum>) => ReactElement;
  gap?: number;
  isRect?: boolean;
  /**
   * Space around the grid, in px: left for the y-axis title (40px) and row labels, bottom for the
   * column labels and x-axis title (70px), right for the legend. Defaults to fitting them.
   */
  margin?: { top: number; right: number; bottom: number; left: number };
  /** Animates the cells in on mount, column by column from the left. Scrolling cuts it short. */
  animationType?: AnimationType;
  showLegend?: boolean;
  /**
   * Replaces the built-in legend with SVG content drawn in the frame it's given: vertical beside
   * the grid (`legendWidth` wide, and included in downloads), and horizontal across the expanded
   * minimap while that is open. The two copies can be on screen at once, so ids must be unique.
   */
  renderLegend?: (frame: HeatmapLegendFrame) => ReactNode;
  /** Width of the column renderLegend draws in. Defaults to the built-in legend's width. */
  legendWidth?: number;
  /**
   * Counts to emphasize, as [min, max] inclusive (use ±Infinity for an open end). Cells outside it
   * fade in the grid and minimap; downloads ignore it. Null or undefined for none.
   */
  highlightRange?: [number, number] | null;
  /**
   * Orientation of the x-axis (column) labels. Defaults to "vertical".
   */
  xLabelOrientation?: "horizontal" | "vertical" | "leftDiagonal" | "rightDiagonal";
  /**
   * The selected cells, by the row/column indices on the bin passed to onClick. Controlled: update
   * it from onClick. Selected cells are framed, and their columns and rows get bold labels, a
   * pointer at the axis and a tick on the minimap's edge. A whole selected column marks only its
   * column; a single cell marks both.
   */
  selectedCells?: HeatmapCellId[];
  /**
   * Fixed pixel width for each cell; without it, the columns share the width available. Fixed-size
   * cells that don't fit scroll under pinned axis labels rather than shrinking.
   */
  cellWidth?: number;
  /** Fixed pixel height for each cell, as cellWidth is for width. */
  cellHeight?: number;
  /** Scrolls the grid sideways to bring newly selected cells into view. */
  scrollToSelection?: boolean;
  /**
   * Shows an overview of the whole grid above it: drag its rectangle to scroll, or click it to
   * expand it. Defaults to false.
   */
  showMiniMap?: boolean;
};