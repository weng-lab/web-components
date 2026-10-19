import React from 'react';
import { AnimationType, DownloadPlotHandle } from '../../utility';
import { ManualSizeProps } from '../../responsive';

/**
 * How bar heights are scaled. Each series is normalized by its own number of values.
 * - count: raw counts
 * - probability: count / series length (each series' heights sum to 1)
 * - density: count / (series length × bin width) (each series' bar areas sum to 1)
 */
export type HistogramNormalize = 'count' | 'probability' | 'density';

/**
 * How multiple series are drawn.
 * - stack: series are stacked within each shared bin
 * - overlay: each series is drawn as its own bars, in array order, so later series sit on top
 */
export type HistogramSeriesLayout = 'stack' | 'overlay';

/**
 * - shared: every series is binned on one set of edges over the combined range
 * - perSeries: each series is binned over its own range. Requires the overlay layout
 */
export type HistogramBinning = 'shared' | 'perSeries';

/**
 * - nice: d3's "nice" bin edges (thresholds is a hint for the bin count)
 * - equalWidth: numpy-style equal-width bins (a number in thresholds is the exact bin count)
 */
export type HistogramBinEdges = 'nice' | 'equalWidth';

export interface HistogramSeries {
    values: ArrayLike<number>;
    label: string;
    color: string;
    /**
     * Bar and legend swatch opacity
     * @default 0.85
     */
    opacity?: number;
}

export interface HistogramBinSeries {
    label: string;
    color: string;
    count: number;
    /** The drawn bar height: the count after normalization */
    value?: number;
}

export interface HistogramBin {
    x0: number;
    x1: number;
    count: number;
    values: number[];
    /** In the overlay layout this holds only the hovered/clicked series */
    series: HistogramBinSeries[];
}

export interface HistogramProps extends ManualSizeProps {
    data: ArrayLike<number> | HistogramSeries[];
    /**
     * thresholds: number ->
     * with binEdges 'nice', a hint to d3 for approximately how many bins to create.
     * d3 may produce a different count depending on the data's range and nice tick values.
     * With binEdges 'equalWidth', the exact number of bins.
     *
     * thresholds: number[] ->
     * explicit bin boundary values (e.g. [0, 25, 50, 75, 100]),
     * giving you full control over where bins start and end
     *
     * @default 20 for 'nice', 10 for 'equalWidth'
     */
    thresholds?: number | number[];
    /**
     * Scale bar heights to counts, probabilities or a probability density
     * @default 'count'
     */
    normalize?: HistogramNormalize;
    /**
     * Stack series within each bin, or overlay each series' bars
     * @default 'stack' ('overlay' when binning is 'perSeries')
     */
    seriesLayout?: HistogramSeriesLayout;
    /**
     * Bin all series on shared edges, or each series over its own range.
     * 'perSeries' always draws as 'overlay'; combining it with seriesLayout 'stack' logs a warning
     * @default 'shared'
     */
    binning?: HistogramBinning;
    /**
     * How bin edges are placed
     * @default 'nice'
     */
    binEdges?: HistogramBinEdges;
    color?: string;
    xLabel?: string;
    yLabel?: string;
    title?: string;
    tooltipBody?: (bin: HistogramBin) => React.ReactElement;
    onBarClicked?: (bin: HistogramBin) => void;
    densityLine?: boolean;
    densityLineColor?: string;
    animationType?: AnimationType;
    /** Base name for downloads; .svg or .png is appended unless the name already ends in one */
    downloadFileName?: string;
    ref?: React.Ref<DownloadPlotHandle>;
}
