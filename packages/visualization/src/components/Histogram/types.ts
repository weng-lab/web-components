import React from 'react';
import { AnimationType, DownloadPlotHandle } from '../../utility';

export interface HistogramBin {
    x0: number;
    x1: number;
    count: number;
    values: number[];
}

export interface HistogramProps {
    data: number[];
    numBins?: number;
    thresholds?: number | number[];
    color?: string;
    xLabel?: string;
    yLabel?: string;
    title?: string;
    tooltipBody?: (bin: HistogramBin) => React.ReactElement;
    onBarClicked?: (bin: HistogramBin) => void;
    animationType?: AnimationType;
    downloadFileName?: string;
    ref?: React.Ref<DownloadPlotHandle>;
}
