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
    onClick: (row: number, column: number, count: string) => void;
    color1: string; // start color for gradient
    color2: string; // end color for gradient
    xLabel?: string;
    yLabel?: string;
    title?: string;
    gap?: number; // gap between cells, defaults to 0
    isRect?: boolean; // controls whether to use rectangles or circles, defaults to rectangles
    margin?: { top: number; right: number; bottom: number; left: number };
    separation?: number;
}