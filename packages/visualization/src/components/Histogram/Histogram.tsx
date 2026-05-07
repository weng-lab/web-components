import { useImperativeHandle, useMemo, useRef } from 'react';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Group } from '@visx/group';
import { LinePath } from '@visx/shape';
import { curveBasis } from '@visx/curve';
import { Text } from '@visx/text';
import { useParentSize } from '@visx/responsive';
import { bin as d3bin, range } from '@visx/vendor/d3-array';
import { downloadAsSVG, downloadSVGAsPNG } from '../../utility';
import { kernelDensityEstimator, gaussian, scottRule } from '../ViolinPlot/helpers';
import { HistogramBin, HistogramProps, HistogramSeries } from './types';
import HistogramLegend from './HistogramLegend';
import HistogramTooltip, { HistogramTooltipHandle } from './HistogramTooltip';
import HistogramBar from './HistogramBar';

const DEFAULT_COLOR = '#4c78a8';

const margin = { top: 40, right: 30, bottom: 80, left: 80 };

function isSeriesData(data: number[] | HistogramSeries[]): data is HistogramSeries[] {
    return data.length > 0 && typeof data[0] === 'object' && 'values' in (data[0] as object);
}

const Histogram = ({
    data,
    ref,
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
    const tooltipRef = useRef<HistogramTooltipHandle | null>(null);
    const { parentRef, width, height } = useParentSize({ debounceTime: 150 });

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

        const binner = Array.isArray(thresholds)
            ? d3bin().thresholds(thresholds)
            : d3bin().thresholds(thresholds ?? 20);
        const allBins = binner(allValues);

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
    }, [allValues, series, thresholds]);

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

    useImperativeHandle(ref, () => ({
        downloadSVG: () => {
            if (svgRef.current) downloadAsSVG(svgRef.current, downloadFileName ?? 'histogram.svg');
        },
        downloadPNG: () => {
            if (svgRef.current) downloadSVGAsPNG(svgRef.current, downloadFileName ?? 'histogram.png');
        },
    }));

    return (
        <div ref={parentRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
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
                            animationType={animationType}
                            binIndex={i}
                            svgRef={svgRef}
                            tooltipRef={tooltipRef}
                            onBarClicked={onBarClicked}
                        />
                    ))}
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
                    {multiSeries && <HistogramLegend series={series} xMax={xMax} />}
                </Group>
            </svg>
            <HistogramTooltip
                ref={tooltipRef}
                multiSeries={multiSeries}
                tooltipBody={tooltipBody}
            />
        </div>
    );
};

export default Histogram;
