import { ReactElement } from "react";
import { DownloadPlotHandle } from "../../utility";

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

export type BinDatums<T> = {
    rowName: string;
    rowNum: number;
    count: number;
    metadata?: T;
}

export type ColumnDatum<T> = {
    columnNum: number;
    columnName: string;
    rows: BinDatums<T>[];
}

export type HeatmapProps<T> = {
    data: ColumnDatum<T>[];
    onClick?: (metadata: T) => void;
    ref?: React.Ref<DownloadPlotHandle>;
    downloadFileName?: string;
    /**
   * Start color for gradient
   */
    color1: string;
    /**
   * Mid color for gradient
   */
    color2: string; 
    /**
   * End color for gradient
   */
    color3: string;
    xLabel?: string;
    yLabel?: string;
    tooltipBody?: (row: number, column: number, count: string) => ReactElement;
    gap?: number; 
    isRect?: boolean;
    margin?: { top: number; right: number; bottom: number; left: number };
}