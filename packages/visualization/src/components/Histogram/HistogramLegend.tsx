import React from 'react';
import { Group } from '@visx/group';
import { HistogramSeries } from './types';

const ROW_HEIGHT = 18;
const SWATCH = 12;
const GAP = 6;
const PADDING = 8;

interface HistogramLegendProps {
    series: HistogramSeries[];
    xMax: number;
}

export function legendDimensions(series: HistogramSeries[]) {
    const width = Math.max(...series.map((s) => s.label.length)) * 7 + SWATCH + GAP + PADDING * 2;
    const height = series.length * ROW_HEIGHT + PADDING * 2;
    return { width, height };
}

const HistogramLegend = ({ series, xMax }: HistogramLegendProps) => {
    const { width, height } = legendDimensions(series);

    return (
        <Group left={xMax - width - 4} top={4}>
            <rect width={width} height={height} fill="white" stroke="#d4d4d4" strokeWidth={1} rx={3} />
            {series.map((s, i) => (
                <Group key={`legend-${i}`} top={PADDING + i * ROW_HEIGHT}>
                    <rect x={PADDING} y={2} width={SWATCH} height={SWATCH} fill={s.color} opacity={0.85} rx={2} />
                    <text
                        x={PADDING + SWATCH + GAP}
                        y={SWATCH / 2 + 2}
                        dominantBaseline="middle"
                        fontSize={11}
                    >
                        {s.label}
                    </text>
                </Group>
            ))}
        </Group>
    );
};

export default HistogramLegend;
