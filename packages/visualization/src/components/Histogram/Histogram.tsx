import { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Group } from '@visx/group';
import { line } from '@visx/shape';
import { curveBasis } from '@visx/curve';
import { motion } from 'framer-motion';
import { Text } from '@visx/text';
import { range, tickStep } from '@visx/vendor/d3-array';
import { downloadAsSVG, downloadSVGAsPNG } from '../../utility';
import { ResponsiveContainer, useResponsiveParentSize } from '../../responsive';
import { kernelDensityEstimator, gaussian, scottRule } from '../ViolinPlot/helpers';
import { HistogramBin, HistogramProps, HistogramSeries } from './types';
import { binHistogram } from './binning';
import HistogramLegend from './HistogramLegend';
import HistogramTooltip from './HistogramTooltip';
import HistogramBar from './HistogramBar';
import { useTapToActivate } from '../../hooks';
import { PlotTooltip, type PlotTooltipHandle } from '../../tooltip';
import { useTheme } from '@mui/material';

const DEFAULT_COLOR = '#4c78a8';
const DEFAULT_OPACITY = 0.85;

const margin = { top: 40, right: 30, bottom: 80, left: 80 };

// d3's default tick step for a small domain (e.g. 0-4) lands on a fraction (0.5), which then
// renders as "0.0", "1.0", ... even though every value is a whole number. Snap to an
// integer step instead so integer-only domains get integer-only tick labels.
function integerTicks(min: number, max: number, count = 10): number[] {
    if (min === max) return [min];
    const step = Math.max(1, Math.ceil(tickStep(min, max, count)));
    const start = Math.ceil(min / step) * step;
    const stop = Math.floor(max / step) * step;
    return range(start, stop + step, step);
}

const formatIntegerTick = (v: { valueOf(): number }) => `${v.valueOf()}`;

// downloadFileName is a base name; a name that already ends in an image extension is used as given
function withExtension(name: string | undefined, extension: 'svg' | 'png'): string {
    if (!name) return `histogram.${extension}`;
    return /\.(svg|png)$/i.test(name) ? name : `${name}.${extension}`;
}

function isSeriesData(data: ArrayLike<number> | HistogramSeries[]): data is HistogramSeries[] {
    return data.length > 0 && typeof data[0] === 'object' && data[0] !== null && 'values' in data[0];
}

const Histogram = ({
    data,
    ref,
    thresholds,
    normalize = 'count',
    seriesLayout,
    binning = 'shared',
    binEdges = 'nice',
    color = DEFAULT_COLOR,
    showLegend = true,
    xLabel,
    yLabel,
    title,
    tooltipBody,
    onBarClicked,
    densityLine = false,
    densityLineColor = '#1c1917',
    animationType,
    downloadFileName,
    width: manualWidth,
    height: manualHeight,
}: HistogramProps) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const tooltipRef = useRef<PlotTooltipHandle<HistogramBin>>(null);
    const theme = useTheme();
    const tap = useTapToActivate<HistogramBin>();
    const { parentRef, containerStyle, width, height } = useResponsiveParentSize({ width: manualWidth, height: manualHeight }, { debounceTime: 150 });

    const multiSeries = isSeriesData(data);

    const series: HistogramSeries[] = useMemo(() => {
        if (isSeriesData(data)) return data;
        return [{ values: data as ArrayLike<number>, label: '', color }];
    }, [data, color]);

    // Per-series bins have different edges, so they can't be stacked
    const layout = binning === 'perSeries' ? 'overlay' : (seriesLayout ?? 'stack');
    useEffect(() => {
        if (binning === 'perSeries' && seriesLayout === 'stack') {
            console.warn('Histogram: binning="perSeries" can\'t be stacked, drawing with seriesLayout="overlay" instead');
        }
    }, [binning, seriesLayout]);

    const xMax = Math.max(width - margin.left - margin.right, 0);
    const yMax = Math.max(height - margin.top - margin.bottom, 0);

    const binned = useMemo(
        () => binHistogram(series.map((s) => s.values), { thresholds, binning, binEdges, normalize }),
        [series, thresholds, binning, binEdges, normalize]
    );
    const isIntegerData = binned?.isInteger ?? false;

    // Stacked layout: one bar per shared bin, with a segment per series
    const bins: HistogramBin[] = useMemo(() => {
        if (!binned?.combined || layout !== 'stack') return [];
        const { edges, counts, values } = binned.combined;
        return counts.map((count, i) => ({
            x0: edges[i],
            x1: edges[i + 1],
            count,
            values: values[i],
            series: series.map((s, si) => ({
                label: s.label,
                color: s.color,
                count: binned.series[si].counts[i] ?? 0,
                value: binned.series[si].heights[i] ?? 0,
            })),
        }));
    }, [binned, layout, series]);

    // Overlay layout: each series' own bars, each bin holding only that series
    const overlayBins: HistogramBin[][] = useMemo(() => {
        if (!binned || layout !== 'overlay') return [];
        return binned.series.map(({ edges, counts, values, heights }, si) => counts.map((count, i) => ({
            x0: edges[i],
            x1: edges[i + 1],
            count,
            values: values[i],
            series: [{ label: series[si].label, color: series[si].color, count, value: heights[i] }],
        })));
    }, [binned, layout, series]);

    const stackOpacities = useMemo(() => series.map((s) => s.opacity ?? DEFAULT_OPACITY), [series]);
    const overlayOpacities = useMemo(() => series.map((s) => [s.opacity ?? DEFAULT_OPACITY]), [series]);

    const kdePoints = useMemo(() => {
        if (!densityLine || !binned) return [];
        const [x0, x1] = binned.domain;
        const ticks = range(x0, x1, (x1 - x0) / 200);

        return series.map((s, si) => {
            const { edges, counts } = binned.series[si];
            if (s.values.length === 0 || counts.length === 0) return { color: s.color, points: [] };
            const values = Array.isArray(s.values) ? s.values : Array.from(s.values);
            const bandwidth = scottRule(values);
            // A series of identical values has no spread to estimate
            if (!(bandwidth > 0)) return { color: s.color, points: [] };
            const densityPoints = kernelDensityEstimator(gaussian(bandwidth), ticks)(values);
            // Scale the density to match the bars' normalization
            const avgBinWidth = (edges[edges.length - 1] - edges[0]) / counts.length;
            const scale = normalize === 'density' ? 1
                : normalize === 'probability' ? avgBinWidth
                : values.length * avgBinWidth;
            return {
                color: s.color,
                points: densityPoints.map((d) => ({ x: d.value, y: d.count * scale })),
            };
        });
    }, [densityLine, binned, series, normalize]);

    const xScale = useMemo(() => {
        if (!binned) return scaleLinear({ domain: [0, 1], range: [0, xMax] });
        return scaleLinear({
            domain: binned.domain,
            range: [0, xMax],
        });
    }, [binned, xMax]);

    const yScale = useMemo(() => {
        let maxY = 0;
        for (const bin of bins) {
            // Counts stack to the combined bin count; normalized heights stack to their sum
            let top = bin.count;
            if (normalize !== 'count') {
                top = 0;
                for (const s of bin.series) top += s.value ?? 0;
            }
            if (top > maxY) maxY = top;
        }
        for (const seriesBins of overlayBins) {
            for (const bin of seriesBins) {
                const top = bin.series[0].value ?? 0;
                if (top > maxY) maxY = top;
            }
        }
        for (const s of kdePoints) {
            for (const p of s.points) {
                if (p.y > maxY) maxY = p.y;
            }
        }
        return scaleLinear({
            domain: [0, maxY],
            range: [yMax, 0],
            nice: true,
        });
    }, [bins, overlayBins, kdePoints, normalize, yMax]);

    const xTickValues = useMemo(() => {
        if (!binned || !isIntegerData) return undefined;
        return integerTicks(binned.domain[0], binned.domain[1]);
    }, [binned, isIntegerData]);

    // Bin counts are always whole numbers, so the count axis never needs decimal ticks.
    // Normalized heights are fractional, so use the scale's own ticks and step-appropriate format.
    const yTicks = useMemo(() => {
        if (normalize === 'count') return { values: integerTicks(0, yScale.domain()[1]), format: formatIntegerTick };
        const format = yScale.tickFormat(10);
        return { values: yScale.ticks(10), format: (v: { valueOf(): number }) => format(v) };
    }, [yScale, normalize]);

    const lineGenerator = useMemo(
        () => line<{ x: number; y: number }>()
            .x((d) => xScale(d.x))
            .y((d) => yScale(d.y))
            .curve(curveBasis),
        [xScale, yScale]
    );

    useImperativeHandle(ref, () => ({
        downloadSVG: () => {
            if (svgRef.current) downloadAsSVG(svgRef.current, withExtension(downloadFileName, 'svg'));
        },
        downloadPNG: () => {
            if (svgRef.current) downloadSVGAsPNG(svgRef.current, withExtension(downloadFileName, 'png'));
        },
    }));

    return (
        <ResponsiveContainer parentRef={parentRef} containerStyle={containerStyle}>
            <svg ref={svgRef} width={width} height={height}>
                {title && (
                    <Text
                        x={margin.left + xMax / 2}
                        y={margin.top / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={14}
                        fontWeight={600}
                    >
                        {title}
                    </Text>
                )}
                <Group left={margin.left} top={margin.top}>
                    {bins.map((bin, i) => (
                        <HistogramBar
                            key={`bin-${i}`}
                            bin={bin}
                            x={xScale(bin.x0)}
                            barWidth={Math.max(xScale(bin.x1) - xScale(bin.x0) - 1, 0)}
                            yScale={yScale}
                            opacities={stackOpacities}
                            animationType={animationType}
                            binIndex={i}
                            tooltipRef={tooltipRef}
                            tap={tap}
                            onBarClicked={onBarClicked}
                        />
                    ))}
                    {overlayBins.map((seriesBins, si) => seriesBins.map((bin, i) => (
                        <HistogramBar
                            key={`series-${si}-bin-${i}`}
                            bin={bin}
                            x={xScale(bin.x0)}
                            barWidth={Math.max(xScale(bin.x1) - xScale(bin.x0) - 1, 0)}
                            yScale={yScale}
                            opacities={overlayOpacities[si]}
                            animationType={animationType}
                            binIndex={i}
                            tooltipRef={tooltipRef}
                            tap={tap}
                            onBarClicked={onBarClicked}
                        />
                    )))}
                    {densityLine && kdePoints.map((s, si) => {
                        const pathD = lineGenerator(s.points);
                        if (!pathD) return null;
                        return (
                            <motion.path
                                key={`kde-${si}`}
                                d={pathD}
                                stroke={multiSeries ? s.color : densityLineColor}
                                strokeWidth={2}
                                fill="none"
                                initial={animationType ? { pathLength: 0 } : false}
                                animate={animationType ? { pathLength: 1 } : {}}
                                transition={{ duration: .75, ease: 'easeInOut' }}
                            />
                        );
                    })}
                    <AxisBottom
                        scale={xScale}
                        top={yMax}
                        tickValues={xTickValues}
                        tickFormat={isIntegerData ? formatIntegerTick : undefined}
                        label={xLabel}
                        labelProps={{
                            fontSize: 12,
                            fontFamily: 'Roboto,Helvetica,Arial,sans-serif',
                            textAnchor: 'middle',
                            fill: '#1c1917',
                            dy: 15,
                        }}
                        tickLabelProps={{
                            fontSize: 11,
                            fontFamily: 'Roboto,Helvetica,Arial,sans-serif',
                            fill: '#1c1917',
                            textAnchor: 'middle',
                        }}
                    />
                    <AxisLeft
                        scale={yScale}
                        tickValues={yTicks.values}
                        tickFormat={yTicks.format}
                        label={yLabel}
                        labelProps={{
                            fontSize: 12,
                            fontFamily: 'Roboto,Helvetica,Arial,sans-serif',
                            textAnchor: 'middle',
                            fill: '#1c1917',
                            dx: -15,
                        }}
                        tickLabelProps={{
                            fontSize: 11,
                            fontFamily: 'Roboto,Helvetica,Arial,sans-serif',
                            fill: '#1c1917',
                            textAnchor: 'end',
                            dx: -4,
                        }}
                    />
                    {multiSeries && showLegend && <HistogramLegend series={series} xMax={xMax} />}
                </Group>
            </svg>
            <PlotTooltip ref={tooltipRef} zIndex={theme.zIndex.tooltip}>
                {(bin) => <HistogramTooltip data={bin} multiSeries={multiSeries} normalize={normalize} tooltipBody={tooltipBody} />}
            </PlotTooltip>
        </ResponsiveContainer>
    );
};

export default Histogram;
