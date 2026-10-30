import { ScaleBand, ScaleLinear } from '@visx/vendor/d3-scale';
import { ReactElement } from "react";
import { AnimationType, DownloadPlotHandle } from '../../utility';
import { ManualSizeProps } from '../../responsive';
import type { TapToActivate } from '../../hooks';
import type { PlotTooltipRef } from '../../tooltip';

type Outliers = "all" | "top" | "bottom" | "none"

export type Datum = {
    value: number;
    count: number
}[]

export type ViolinPoint<T> = {
    value: number;
    outlier?: boolean;
    color?: string;
    stroke?: string;
    radius?: number;
    opacity?: number;
    metadata?: T;
}

export type Distribution<T> = {
    data: ViolinPoint<T>[];
    label?: string;
    violinColor?: string;
    opacity?: number;
}

export type ViolinProps = {
    bandwidth?: number | "scott" | "silverman" | ((data: number[]) => number);
    stroke?: number;
    pointDisplayThreshold?: number;
    showAllPoints?: boolean;
    jitter?: number;
}

export type CrossProps = {
    color?: string;
    stroke?: number;
    outliers?: Outliers;
    medianColor?: string;
    medianWidth?: number;
}

export type ViolinPlotProps<T> = ManualSizeProps & {
    distributions: Distribution<T>[];
    loading: boolean;
    ref?: React.Ref<DownloadPlotHandle>;
    axisLabel?: string;
    disableCrossPlot?: boolean;
    disableViolinPlot?: boolean;
    crossProps?: CrossProps;
    violinProps?: ViolinProps;
    /**
     * Which way the violins stand. "auto" stands them up unless their labels would run into each other, or
     * they'd stand too short under them to read, and otherwise lays them on their sides, one to a row with
     * its label across, in rows that scroll past what fits.
     * @default "auto", or what `horizontal` says where it's set
     */
    orientation?: "auto" | "vertical" | "horizontal";
    /** @deprecated Use `orientation`, which this sets to "horizontal" or "vertical" where it's left out. */
    horizontal?: boolean;
    /** How the labels read. Violins "auto" lays on their sides read theirs across, whatever this says. */
    labelOrientation?: "horizontal" | "vertical" | "leftDiagonal" | "rightDiagonal"
    onViolinClicked?: (distribution: Distribution<T>) => void;
    onPointClicked?: (point: ViolinPoint<T>) => void;
    pointTooltipBody?: (point: ViolinPoint<T>) => ReactElement;
    downloadFileName?: string;
    cutoffValue?: number;
    cutoffOpacity?: number;
    cutoffLine?: "none" | "dashed" | "solid";
    show95thPercentileLine?: boolean;
    animation?: AnimationType;
    //default .03
    animationBuffer?: number;
}

export interface CrossPlotProps<T> {
    crossProps?: CrossProps;
    left: number;
    top: number;
    median: number;
    firstQuartile: number;
    thirdQuartile: number;
    valueScale: (value: number) => number;
    medianWidth: number;
    tooltipData: TooltipData<T>;
    handleMouseMove: (event: React.MouseEvent<SVGPathElement>, data: TooltipData<T>) => void;
    handleCrossClick: () => void;
    disableViolinPlot: boolean;
    tooltip: TooltipData<T>;
    horizontal: boolean;
}


export interface TooltipData<T> {
    point?: ViolinPoint<T>;
    label?: string;
    min?: string;
    median?: string;
    max?: string;
    firstQuartile?: string;
    thirdQuartile?: string;
    outlier?: boolean;
    sampleSize?: number;
    value?: string;
}

export interface TooltipProps<T> {
    data: TooltipData<T>;
    pointTooltipBody?: (point: ViolinPoint<T>) => ReactElement;
}

export interface SingleViolinProps<T> {
    distribution: Distribution<T>;
    distIndex: number;
    violinProps: ViolinProps | undefined;
    crossProps: CrossProps | undefined;
    valueScale: ScaleLinear<number, number, never>;
    labelScale: ScaleBand<string>;
    offset: number;
    labels: string[];
    disableViolinPlot: boolean;
    disableCrossPlot: boolean;
    horizontal: boolean;
    pointTooltipBody?: (point: ViolinPoint<T>) => ReactElement;
    onViolinClicked?: (distribution: Distribution<T>) => void | undefined;
    onPointClicked?: (point: ViolinPoint<T>) => void | undefined;
    tap: TapToActivate<string>;
    tooltipRef: PlotTooltipRef<TooltipData<T>>;
}