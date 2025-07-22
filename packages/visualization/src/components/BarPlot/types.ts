export interface BarData<T> {
  category?: string;
  label?: string;
  value: number;
  /**
   * Unique ID for the data point. This is a string and not number since scaleBand needs a string[] for it's domain
   */
  id: string;
  color?: string;
  metadata?: T;
}

export interface BarPlotProps<T> {
  data: BarData<T>[];
  SVGref?: React.RefObject<SVGSVGElement>
  topAxisLabel?: string;
  onBarClicked?: (bar: BarData<T>) => void;
  TooltipContents?: (bar: BarData<T>) => React.ReactNode
  /**
   * Shows dotted line at xScale(1.645)
   */
  show95thPercentileLine?: boolean
  /**
   * If true, will cutoff negative values in the chart at -0.5, and add a 
   */
  cutoffNegativeValues?: boolean;
  /**
   * Change the space each bar takes up (increaseing by a facotr of 4 + 15)
   * @default 0 (15)
   */
  barSize?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  sortByCategory?: boolean;
  /**
   * how the bars and axes should be oriented visually,
   * @default horizontal
   * @todo vertical code exists but not ready yet, only use horizontal for now
   */
  barOrientation?: "horizontal" | "vertical";
}