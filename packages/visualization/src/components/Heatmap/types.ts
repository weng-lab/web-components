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
        count: 20,
	    rowName: celltype_a
      },
    ],
  },
];
*/

export type BinDatums = {
    rowName: string;
    rowNum: number;
    count: number;
}

export type ColumnDatum = {
    columnNum: number;
    columnName: string;
    rows: BinDatums[];
}

export type HeatmapProps = {
    data: ColumnDatum[];
    onClick?: (row: number, column: number, count: string) => void;
    ref?: React.Ref<DownloadPlotHandle>;
    downloadFileName?: string;
    /**
   * Start color for gradient
   */
    color1: string;
    /**
   * End color for gradient
   */
    color2: string; 
    xLabel?: string;
    yLabel?: string;
    tooltipBody?: (row: number, column: number, count: string) => ReactElement;
    gap?: number; 
    isRect?: boolean;
    margin?: { top: number; right: number; bottom: number; left: number };
}