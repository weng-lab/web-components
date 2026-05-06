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
    numBins?: number;
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
