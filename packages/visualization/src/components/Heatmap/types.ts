import { ReactElement } from "react";
import { DownloadPlotHandle } from "../../utility";
import { RectCell } from "@visx/heatmap/lib/heatmaps/HeatmapRect";
import { CircleCell } from "@visx/heatmap/lib/heatmaps/HeatmapCircle";

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

export type HeatmapProps<C extends object = Record<string, unknown>, R extends object = Record<string, unknown>> = {
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
};