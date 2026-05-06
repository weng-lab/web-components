import React, { useImperativeHandle, useMemo, useRef } from 'react';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Group } from '@visx/group';
import { Text } from '@visx/text';
import { useParentSize } from '@visx/responsive';
import { useTooltip, TooltipWithBounds } from '@visx/tooltip';
import { bin as d3bin } from '@visx/vendor/d3-array';
import { motion } from 'framer-motion';
import { downloadAsSVG, downloadSVGAsPNG, getAnimationProps } from '../../utility';
import { HistogramBin, HistogramProps } from './types';

const DEFAULT_COLOR = '#4c78a8';

const margin = { top: 40, right: 30, bottom: 60, left: 60 };

const MotionRect = motion.rect;

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
    animationType,
    downloadFileName,
}: HistogramProps) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const { parentRef, width, height } = useParentSize({ debounceTime: 150 });

    const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
        useTooltip<HistogramBin>();

    const xMax = Math.max(width - margin.left - margin.right, 0);
    const yMax = Math.max(height - margin.top - margin.bottom, 0);

    const bins: HistogramBin[] = useMemo(() => {
        const binner = Array.isArray(thresholds)
            ? d3bin().thresholds(thresholds)
            : d3bin().thresholds(thresholds ?? numBins ?? 20);
        return binner(data).map((b) => ({
            x0: b.x0 ?? 0,
            x1: b.x1 ?? 0,
            count: b.length,
            values: [...b],
        }));
    }, [data, numBins, thresholds]);

    const xScale = useMemo(() => {
        if (bins.length === 0) return scaleLinear({ domain: [0, 1], range: [0, xMax] });
        return scaleLinear({
            domain: [bins[0].x0, bins[bins.length - 1].x1],
            range: [0, xMax],
        });
    }, [bins, xMax]);

    const yScale = useMemo(() => {
        const maxCount = Math.max(...bins.map((b) => b.count), 0);
        return scaleLinear({
            domain: [0, maxCount],
            range: [yMax, 0],
            nice: true,
        });
    }, [bins, yMax]);

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
                        const barHeight = yMax - yScale(bin.count);
                        const barY = yScale(bin.count);

                        const animProps = getAnimationProps(animationType, i);

                        return (
                            <MotionRect
                                key={`bin-${i}`}
                                x={x}
                                y={barY}
                                width={barWidth}
                                height={Math.max(barHeight, 0)}
                                fill={color}
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
                                {...animProps}
                            />
                        );
                    })}

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
                            <div>
                                <strong>Count:</strong> {tooltipData.count}
                            </div>
                        </div>
                    )}
                </TooltipWithBounds>
            )}
        </div>
    );
};

export default Histogram;
