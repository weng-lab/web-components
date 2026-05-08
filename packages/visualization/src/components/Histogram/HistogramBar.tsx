import React, { memo, useState } from 'react';
import { Bar } from '@visx/shape';
import { motion } from 'framer-motion';
import { getAnimationProps, AnimationType } from '../../utility';
import { HistogramBin } from './types';
import { HistogramTooltipHandle } from './HistogramTooltip';

export interface HistogramBarProps {
    bin: HistogramBin;
    x: number;
    barWidth: number;
    yScale: (v: number) => number;
    animationType?: AnimationType;
    binIndex: number;
    svgRef: React.RefObject<SVGSVGElement | null>;
    tooltipRef: React.RefObject<HistogramTooltipHandle | null>;
    onBarClicked?: (bin: HistogramBin) => void;
}

//memoize so that entire chart doesnt re-render on hover, just the hovered bar
const HistogramBar = memo(({ bin, x, barWidth, yScale, animationType, binIndex, svgRef, tooltipRef, onBarClicked }: HistogramBarProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const Wrapper = animationType ? motion.g : 'g';
    const animProps = getAnimationProps(animationType, binIndex);

    let totCount = 0;
    const segments = bin.series.map((s, si) => {
        const start = totCount;
        totCount += s.count;
        return { s, si, segY: yScale(start + s.count), segHeight: Math.max(yScale(start) - yScale(start + s.count), 0) };
    });

    return (
        <Wrapper
            {...animProps}
            onMouseEnter={(e: React.MouseEvent) => {
                setIsHovered(true);
                const rect = svgRef.current?.getBoundingClientRect();
                tooltipRef.current?.show(bin, rect ? e.clientX - rect.left + 10 : e.pageX, rect ? e.clientY - rect.top : e.pageY);
            }}
            onMouseMove={(e: React.MouseEvent) => {
                const rect = svgRef.current?.getBoundingClientRect();
                tooltipRef.current?.show(bin, rect ? e.clientX - rect.left + 10 : e.pageX, rect ? e.clientY - rect.top : e.pageY);
            }}
            onMouseLeave={() => {
                setIsHovered(false);
                tooltipRef.current?.hide();
            }}
        >
            {segments.map(({ s, si, segY, segHeight }) => (
                <Bar
                    key={`seg-${si}`}
                    x={x}
                    y={segY}
                    width={barWidth}
                    height={segHeight}
                    fill={s.color}
                    opacity={0.85}
                    stroke={isHovered ? '#000000' : 'none'}
                    style={{ cursor: onBarClicked ? 'pointer' : 'default' }}
                    onClick={() => onBarClicked?.(bin)}
                />
            ))}
        </Wrapper>
    );
});

export default HistogramBar;
