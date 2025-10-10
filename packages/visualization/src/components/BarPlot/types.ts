export interface BarData<T> {
  category?: string;
  label?: string;
  value: number;
  /**
   * Unique ID for the data point. This is a string and not number since scaleBand needs a string[] for it's domain
   */
  id: string;
  color?: string;
  lollipopValue?: number
  metadata?: T;
}

export interface BarPlotHandle {
  downloadSVG: () => void;
  downloadPNG: () => void;
}

export interface BarPlotProps<T> {
  data: BarData<T>[];
  ref?: React.Ref<BarPlotHandle>
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
   * @default 15
   */
  barSize?: number;
  /**
   * Change the space between each bar in pixels
   * @default 2
   */
  barSpacing?: number;
  /**
   * Fit the chart into the parents height
   * will make barSpacing negligible 
   */
  fill?: boolean;
  legendTitle?: string;
  legendValues?: [number] | [number, number] | [number, number, number] | [number, number, number, number];
  downloadFileName?: string;
}

export type LollipopLegendProps = {
    values: number[];
    label: string;
    getlollipopRadius: (x: number) => number;
    height: number;
    width: number;
    legendValues: number[];
    spaceForCategory: number;
    axisCenter: number;
    loading: boolean;
}