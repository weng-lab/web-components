import React, { useImperativeHandle, useMemo, useRef } from 'react';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Group } from '@visx/group';
import { Bar, LinePath } from '@visx/shape';
import { curveBasis } from '@visx/curve';
import { Text } from '@visx/text';
import { useParentSize } from '@visx/responsive';
import { useTooltip, TooltipWithBounds } from '@visx/tooltip';
import { bin as d3bin, range } from '@visx/vendor/d3-array';
import { motion } from 'framer-motion';
import { downloadAsSVG, downloadSVGAsPNG, getAnimationProps } from '../../utility';
import { kernelDensityEstimator, gaussian, scottRule } from '../ViolinPlot/helpers';
import { HistogramBin, HistogramProps, HistogramSeries } from './types';

const DEFAULT_COLOR = '#4c78a8';

const margin = { top: 40, right: 30, bottom: 60, left: 60 };

const LEGEND_ROW_HEIGHT = 18;
const LEGEND_SWATCH = 12;
const LEGEND_GAP = 6;
const LEGEND_PADDING = 8;

function isSeriesData(data: number[] | HistogramSeries[]): data is HistogramSeries[] {
    return data.length > 0 && typeof data[0] === 'object' && 'values' in (data[0] as object);
}

//TODO
// fix tooltip
// seperate legend and maybe tooltip into files
// look through and clean up code
// on hover highlight bin
// animate distribution line?
// check performance with react scan
// xlabel and ylabel don't show up

const Histogram = ({
    data,
    ref,
    numBins,
    thresholds,
    color = DEFAULT_COLOR,
    xLabel,
    yLabel,
    title,
    tooltipBody,
    onBarClicked,
    distributionLine = false,
    distributionLineColor = '#1c1917',
    animationType,
    downloadFileName,
}: HistogramProps) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const { parentRef, width, height } = useParentSize({ debounceTime: 150 });

    const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
        useTooltip<HistogramBin>();

    const multiSeries = isSeriesData(data);

    const series: HistogramSeries[] = useMemo(() => {
        if (isSeriesData(data)) return data;
        return [{ values: data as number[], label: '', color }];
    }, [data, color]);

    const allValues = useMemo(() => series.flatMap((s) => s.values), [series]);

    const xMax = Math.max(width - margin.left - margin.right, 0);
    const yMax = Math.max(height - margin.top - margin.bottom, 0);

    const bins: HistogramBin[] = useMemo(() => {
        if (allValues.length === 0) return [];

        // Bin the combined data to get consistent edges
        const binner = Array.isArray(thresholds)
            ? d3bin().thresholds(thresholds)
            : d3bin().thresholds(thresholds ?? numBins ?? 20);
        const allBins = binner(allValues);

        // Re-bin each series using the same edges so counts are aligned
        const domainX0 = allBins[0]?.x0 ?? 0;
        const domainX1 = allBins[allBins.length - 1]?.x1 ?? 1;
        const innerEdges = allBins.map((b) => b.x0!).slice(1);
        const seriesBinner = d3bin().domain([domainX0, domainX1]).thresholds(innerEdges);
        const seriesBins = series.map((s) => seriesBinner(s.values));

        return allBins.map((b, i) => ({
            x0: b.x0 ?? 0,
            x1: b.x1 ?? 0,
            count: b.length,
            values: [...b],
            series: series.map((s, si) => ({
                label: s.label,
                color: s.color,
                count: seriesBins[si][i]?.length ?? 0,
            })),
        }));
    }, [allValues, series, numBins, thresholds]);

    const kdePoints = useMemo(() => {
        if (!distributionLine || bins.length === 0) return [];
        const x0 = bins[0].x0;
        const x1 = bins[bins.length - 1].x1;
        const avgBinWidth = (x1 - x0) / bins.length;

        return series.map((s) => {
            if (s.values.length === 0) return { color: s.color, points: [] };
            const bandwidth = scottRule(s.values);
            const ticks = range(x0, x1, (x1 - x0) / 200);
            const densityPoints = kernelDensityEstimator(gaussian(bandwidth), ticks)(s.values);
            const scale = s.values.length * avgBinWidth;
            return {
                color: s.color,
                points: densityPoints.map((d) => ({ x: d.value, y: d.count * scale })),
            };
        });
    }, [distributionLine, bins, series]);

    const xScale = useMemo(() => {
        if (bins.length === 0) return scaleLinear({ domain: [0, 1], range: [0, xMax] });
        return scaleLinear({
            domain: [bins[0].x0, bins[bins.length - 1].x1],
            range: [0, xMax],
        });
    }, [bins, xMax]);

    const yScale = useMemo(() => {
        const maxBarCount = Math.max(...bins.map((b) => b.count), 0);
        const maxKde = kdePoints.flatMap((s) => s.points.map((p) => p.y));
        const maxKdeVal = maxKde.length > 0 ? Math.max(...maxKde) : 0;
        return scaleLinear({
            domain: [0, Math.max(maxBarCount, maxKdeVal)],
            range: [yMax, 0],
            nice: true,
        });
    }, [bins, kdePoints, yMax]);

    // Legend dimensions
    const legendHeight = multiSeries
        ? series.length * LEGEND_ROW_HEIGHT + LEGEND_PADDING * 2
        : 0;
    const legendWidth = multiSeries
        ? Math.max(...series.map((s) => s.label.length)) * 7 + LEGEND_SWATCH + LEGEND_GAP + LEGEND_PADDING * 2
        : 0;

    useImperativeHandle(ref, () => ({
        downloadSVG: () => {
            if (svgRef.current) downloadAsSVG(svgRef.current, downloadFileName ?? 'histogram.svg');
        },
        downloadPNG: () => {
            if (svgRef.current) downloadSVGAsPNG(svgRef.current, downloadFileName ?? 'histogram.png');
        },
    }));

    return (
        <div ref={parentRef} style={{ width: '100%', height: '100%' }}>
            <svg ref={svgRef} width={width} height={height}>
                {title && (
                    <Text
                        x={margin.left + xMax / 2}
                        y={margin.top / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={14}
                        fontFamily="Roboto,Helvetica,Arial,sans-serif"
                        fill="#1c1917"
                        fontWeight={600}
                    >
                        {title}
                    </Text>
                )}
                <Group left={margin.left} top={margin.top}>
                    {bins.map((bin, i) => {
                        const x = xScale(bin.x0);
                        const barWidth = Math.max(xScale(bin.x1) - xScale(bin.x0) - 1, 0);

                        const Wrapper = animationType ? motion.g : 'g';
                        const animProps = getAnimationProps(animationType, i);

                        let cumCount = 0;

                        return (
                            <Wrapper key={`bin-${i}`} {...animProps}>
                                {bin.series.map((s, si) => {
                                    const segY = yScale(cumCount + s.count);
                                    const segHeight = Math.max(yScale(cumCount) - yScale(cumCount + s.count), 0);
                                    cumCount += s.count;

                                    return (
                                        <Bar
                                            key={`seg-${si}`}
                                            x={x}
                                            y={segY}
                                            width={barWidth}
                                            height={segHeight}
                                            fill={s.color}
                                            opacity={0.85}
                                            style={{ cursor: onBarClicked ? 'pointer' : 'default' }}
                                            onClick={() => onBarClicked?.(bin)}
                                            onMouseEnter={(e: React.MouseEvent) => {
                                                showTooltip({
                                                    tooltipData: bin,
                                                    tooltipLeft: e.pageX,
                                                    tooltipTop: e.pageY,
                                                });
                                            }}
                                            onMouseLeave={hideTooltip}
                                        />
                                    );
                                })}
                            </Wrapper>
                        );
                    })}

                    {distributionLine && kdePoints.map((s, si) => (
                        s.points.length > 0 && (
                            <LinePath
                                key={`kde-${si}`}
                                data={s.points}
                                x={(d) => xScale(d.x)}
                                y={(d) => yScale(d.y)}
                                curve={curveBasis}
                                stroke={multiSeries ? s.color : distributionLineColor}
                                strokeWidth={2}
                                fill="none"
                            />
                        )
                    ))}
                    <AxisBottom
                        scale={xScale}
                        top={yMax}
                        label={xLabel}
                        labelProps={{
                            fontSize: 12,
                            fontFamily: 'Roboto,Helvetica,Arial,sans-serif',
                            textAnchor: 'middle',
                            fill: '#1c1917',
                            dy: 36,
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
                        label={yLabel}
                        labelProps={{
                            fontSize: 12,
                            fontFamily: 'Roboto,Helvetica,Arial,sans-serif',
                            textAnchor: 'middle',
                            fill: '#1c1917',
                            dx: -44,
                        }}
                        tickLabelProps={{
                            fontSize: 11,
                            fontFamily: 'Roboto,Helvetica,Arial,sans-serif',
                            fill: '#1c1917',
                            textAnchor: 'end',
                            dx: -4,
                        }}
                    />
                    {multiSeries && (
                        <Group left={xMax - legendWidth - 4} top={4}>
                            <rect
                                width={legendWidth}
                                height={legendHeight}
                                fill="white"
                                stroke="#d4d4d4"
                                strokeWidth={1}
                                rx={3}
                            />
                            {series.map((s, i) => (
                                <Group key={`legend-${i}`} top={LEGEND_PADDING + i * LEGEND_ROW_HEIGHT}>
                                    <rect
                                        x={LEGEND_PADDING}
                                        y={2}
                                        width={LEGEND_SWATCH}
                                        height={LEGEND_SWATCH}
                                        fill={s.color}
                                        opacity={0.85}
                                        rx={2}
                                    />
                                    <text
                                        x={LEGEND_PADDING + LEGEND_SWATCH + LEGEND_GAP}
                                        y={LEGEND_SWATCH / 2 + 2}
                                        dominantBaseline="middle"
                                        fontSize={11}
                                        fontFamily="Roboto,Helvetica,Arial,sans-serif"
                                        fill="#1c1917"
                                    >
                                        {s.label}
                                    </text>
                                </Group>
                            ))}
                        </Group>
                    )}
                </Group>
            </svg>
            {tooltipOpen && tooltipData && (
                <TooltipWithBounds left={tooltipLeft} top={tooltipTop}>
                    {tooltipBody ? (
                        tooltipBody(tooltipData)
                    ) : (
                        <div style={{ fontFamily: 'Roboto,Helvetica,Arial,sans-serif', fontSize: 12 }}>
                            <div>
                                <strong>Range:</strong> [{tooltipData.x0.toFixed(2)}, {tooltipData.x1.toFixed(2)})
                            </div>
                            {multiSeries ? (
                                tooltipData.series.map((s) => (
                                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: s.color, display: 'inline-block' }} />
                                        <span><strong>{s.label}:</strong> {s.count}</span>
                                    </div>
                                ))
                            ) : (
                                <div><strong>Count:</strong> {tooltipData.count}</div>
                            )}
                        </div>
                    )}
                </TooltipWithBounds>
            )}
        </div>
    );
};

export default Histogram;
