import { AnimationType, DownloadPlotHandle } from "../../utility";
import { ManualSizeProps } from "../../responsive";
import type { PlotTooltipRef } from "../../tooltip";
import type { TapToActivate } from "../../hooks";

export interface BarData<T> {
  category?: string;
  label?: string;
  value: number;
  /**
   * Unique ID for the data point. This is a string and not number since scaleBand needs a string[] for it's domain
   */
  id: string;
  color?: string;
  stroke?: string;
  lollipopValue?: number
  metadata?: T;
}

export interface BarPlotProps<T> extends ManualSizeProps {
  data: BarData<T>[];
  ref?: React.Ref<DownloadPlotHandle>
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
  /**
   * The most of the width past the category labels that the value labels may take, as a fraction. Labels
   * that don't fit past their bar are cut short with an ellipsis, so a narrow plot keeps room for its bars.
   * @default 0.5
   */
  maxLabelShare?: number;
  legendTitle?: string;
  legendValues?: [number] | [number, number] | [number, number, number] | [number, number, number, number];
  downloadFileName?: string;
  animation?: AnimationType;
  animationBuffer?: number;
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

export interface SingleBarProps<T> {
    bar: BarData<T>;
    index: number;
    onBarClicked?: (bar: BarData<T>) => void;
    tooltipRef: PlotTooltipRef<BarData<T>>;
    tap: TapToActivate<BarData<T>>;
    cutoffNegativeValues: boolean;
    negativeCutoff: number;
    xScale: any;
    yScale: any;
    barSize: number;
    barSpacing: number;
    gapBetweenTextAndBar: number;
    getLollipopRadius: (x: number) => number;
    /** Where the value label must end: it's cut short with an ellipsis where it would run past. */
    labelRight: number;
    animation?: AnimationType;
    animationEnabled: boolean;
    animationBuffer?: number;
}