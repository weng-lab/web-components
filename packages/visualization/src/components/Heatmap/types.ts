import { ReactElement, ReactNode } from "react";
import { DownloadPlotHandle, AnimationType } from "../../utility";
import { RectCell, CircleCell } from "@visx/heatmap";
import { ManualSizeProps } from "../../responsive";

/*
Example data format:
[
  {
    columnNum: 1,
    columnName: celltype_1
    rows: [
      {
        rowNum: 1,
	      rowName: celltype_a
        count: 20,
        metadata: { ... }
      },
    ],
  },
];
*/

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

/** Where renderLegend draws: the box it has, and which way its bar should run. */
export type HeatmapLegendFrame = {
  width: number;
  height: number;
  /**
   * "vertical" in the column beside the grid; "horizontal" in the band across the top of the
   * expanded minimap.
   */
  orientation: "vertical" | "horizontal";
  /**
   * Set in the expanded minimap, which sits above everything else on the page: its root element. A
   * tooltip or other overlay the legend opens must portal into it to show above the minimap rather
   * than behind it - MUI's `slotProps={{ popper: { container } }}`, say. Undefined beside the grid.
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
  margin?: { top: number; right: number; bottom: number; left: number };
  animationType?: AnimationType;
  showLegend?: boolean;
  /**
   * Replaces the built-in color legend. Return SVG content, drawn inside an <svg> the frame's size:
   * - Beside the grid, vertical: a column `legendWidth` wide and as tall as the grid's visible
   *   area. Downloads include it, just as they include the built-in legend.
   * - Across the top of the expanded minimap, horizontal, while that is open - a second copy, so
   *   nothing in it should assume it is the only one.
   * Anything interactive in it works on screen in both, so a legend that sets highlightRange as it
   * is swept lights up the expanded minimap too; anything that must not appear in a download
   * belongs outside it.
   */
  renderLegend?: (frame: HeatmapLegendFrame) => ReactNode;
  /** Width of the column renderLegend draws in. Defaults to the built-in legend's width. */
  legendWidth?: number;
  /**
   * Counts to emphasize, as [min, max] inclusive - an open end is -Infinity or Infinity. Every other
   * cell fades, so the cells in the range stand out wherever they are in the grid and minimap:
   * what a legend hands the plot as it is swept. Downloads ignore it. Undefined or null draws every
   * cell as normal.
   */
  highlightRange?: [number, number] | null;
  /**
   * Orientation of the x-axis (column) labels. Defaults to "vertical".
   */
  xLabelOrientation?: "horizontal" | "vertical" | "leftDiagonal" | "rightDiagonal";
  /**
   * The currently selected cells, identified by the same row/column indices found on the bin
   * passed to onClick (bin.row, bin.column). When non-empty, every cell not in this list renders
   * as deselectedColor while selected cells keep their normal gradient color. Pass an empty array
   * or undefined for no selection. Selection is controlled - use onClick to update it from the consumer.
   */
  selectedCells?: HeatmapCellId[];
  /**
   * Fill color used for cells not in selectedCells. Defaults to a neutral gray.
   */
  deselectedColor?: string;
  /**
   * Fixed pixel width/height for each cell. Provide both to render cells at this exact size
   * instead of stretching them to fill the container. Once the data no longer fits in the
   * available space, the grid becomes scrollable in both directions with the row and column
   * axis labels pinned in place (frozen panes), so large datasets stay legible instead of
   * cells shrinking and overlapping.
   */
  cellWidth?: number;
  cellHeight?: number;
  scrollToSelection?: boolean;
  showMiniMap?: boolean;
};