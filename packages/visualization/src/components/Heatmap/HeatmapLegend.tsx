import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";

const BAR_WIDTH = 14;
const LABEL_GAP = 6;
const TICK_WIDTH = 4;
const FONT_SIZE = 11;
const NUM_TICKS = 5;

interface HeatmapLegendProps {
    colors: [string, string, ...string[]];
    minValue: number;
    maxValue: number;
    height: number;
}

const formatTick = (value: number) =>
    value % 1 === 0 ? String(value) : value.toFixed(1);

const HeatmapLegend = ({ colors, minValue, maxValue, height }: HeatmapLegendProps) => {
    const gradientId = "heatmap-legend-gradient";

    const colorScale = scaleLinear<string>({
        range: colors,
        domain: colors.map((_, i) => minValue + (i * (maxValue - minValue)) / (colors.length - 1)),
    });

    const tickValues = Array.from({ length: NUM_TICKS }, (_, i) =>
        minValue + (i * (maxValue - minValue)) / (NUM_TICKS - 1)
    );

    const yScale = scaleLinear<number>({
        domain: [maxValue, minValue],
        range: [0, height],
    });

    return (
        <Group>
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    {colors.map((color, i) => (
                        <stop
                            key={i}
                            offset={`${(i / (colors.length - 1)) * 100}%`}
                            stopColor={color}
                        />
                    ))}
                </linearGradient>
            </defs>
            <rect
                x={0}
                y={0}
                width={BAR_WIDTH}
                height={height}
                fill={`url(#${gradientId})`}
                rx={2}
            />
            {tickValues.map((value, i) => {
                const y = yScale(value);
                return (
                    <g key={i}>
                        <line
                            x1={BAR_WIDTH}
                            x2={BAR_WIDTH + TICK_WIDTH}
                            y1={y}
                            y2={y}
                            stroke="#4d4f52"
                            strokeWidth={1}
                        />
                        <text
                            x={BAR_WIDTH + TICK_WIDTH + LABEL_GAP}
                            y={y}
                            dominantBaseline="middle"
                            fontSize={FONT_SIZE}
                            fontFamily="sans-serif"
                            fill="#4d4f52"
                        >
                            {formatTick(value)}
                        </text>
                    </g>
                );
            })}
        </Group>
    );
};

export default HeatmapLegend;
export type { HeatmapLegendProps };
