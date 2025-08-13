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
   * Change the space each bar takes up in pixels
   * @default auto takes up space based on length of data
   */
  barSize?: number
  sortByCategory?: boolean;
  fill?: boolean;
}