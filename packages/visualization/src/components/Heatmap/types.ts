import { ReactElement } from "react";
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
    count: number;
    metadata?: R;
}

export type ColumnDatum<C extends object = Record<string, unknown>, R extends object = Record<string, unknown>> = {
    columnName: string;
    rows: RowDatum<R>[];
    metadata?: C
}

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
  xLabel?: string;
  yLabel?: string;
  tooltipBody?: (bin:  RectCell<ColumnDatum, RowDatum> | CircleCell<ColumnDatum, RowDatum>) => ReactElement;
  gap?: number;
  isRect?: boolean;
  margin?: { top: number; right: number; bottom: number; left: number };
  animationType?: AnimationType;
  showLegend?: boolean;
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
  selectedCells?: { row: number; column: number }[];
  /**
   * Fill color used for cells not in selectedCells. Defaults to a neutral gray.
   */
  deselectedColor?: string;
};