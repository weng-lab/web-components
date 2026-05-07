import React from 'react';
import { AnimationType, DownloadPlotHandle } from '../../utility';

export interface HistogramSeries {
    values: number[];
    label: string;
    color: string;
}

export interface HistogramBinSeries {
    label: string;
    color: string;
    count: number;
}

export interface HistogramBin {
    x0: number;
    x1: number;
    count: number;
    values: number[];
    series: HistogramBinSeries[];
}

export interface HistogramProps {
    data: number[] | HistogramSeries[];
    /**
     * thresholds: number ->
     * a hint to d3 for approximately how many bins to create. 
     * d3 may produce a different count depending on the data's range and nice tick values.
     * 
     * thresholds: number[] ->
     * explicit bin boundary values (e.g. [0, 25, 50, 75, 100]), 
     * giving you full control over where bins start and end
     * 
     * @default 20
     */
    thresholds?: number | number[];
    color?: string;
    xLabel?: string;
    yLabel?: string;
    title?: string;
    tooltipBody?: (bin: HistogramBin) => React.ReactElement;
    onBarClicked?: (bin: HistogramBin) => void;
    distributionLine?: boolean;
    distributionLineColor?: string;
    animationType?: AnimationType;
    downloadFileName?: string;
    ref?: React.Ref<DownloadPlotHandle>;
}
