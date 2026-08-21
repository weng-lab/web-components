import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { measureTextWidth } from "../../utility";

const BAR_WIDTH = 14;
const LABEL_GAP = 6;
const TICK_WIDTH = 4;
const FONT_SIZE = 11;
const FONT_FAMILY = "sans-serif";
const NUM_TICKS = 5;

interface HeatmapLegendProps {
    colors: [string, string, ...string[]];
    minValue: number;
    maxValue: number;
    height: number;
}

const formatTick = (value: number) =>
    value % 1 === 0 ? String(value) : value.toFixed(1);

const getTickValues = (minValue: number, maxValue: number) =>
    Array.from({ length: NUM_TICKS }, (_, i) =>
        minValue + (i * (maxValue - minValue)) / (NUM_TICKS - 1)
    );

// Canvas's measureText and the browser's actual SVG text layout don't agree to the sub-pixel,
// and the gap widens with string length - pad generously so longer labels (more digits) don't
// creep past the reserved width and get clipped by the svg's default overflow:hidden.
const LABEL_WIDTH_SAFETY_FACTOR = 1.15;
const RIGHT_PADDING = 6;

// Full width needed to render the legend (color bar + ticks + tick labels) without
// clipping, based on the widest formatted tick label for the given value range.
export const getHeatmapLegendWidth = (minValue: number, maxValue: number): number => {
    const maxLabelWidth = Math.max(
        ...getTickValues(minValue, maxValue).map((value) =>
            measureTextWidth(formatTick(value), FONT_SIZE, FONT_FAMILY)
        )
    );
    return BAR_WIDTH + TICK_WIDTH + LABEL_GAP + maxLabelWidth * LABEL_WIDTH_SAFETY_FACTOR + RIGHT_PADDING;
};

const HeatmapLegend = ({ colors, minValue, maxValue, height }: HeatmapLegendProps) => {
    const gradientId = "heatmap-legend-gradient";

    const tickValues = getTickValues(minValue, maxValue);

    const yScale = scaleLinear<number>({
        domain: [maxValue, minValue],
        range: [0, height],
    });

    return (
        <Group>
            <defs>
                {/* The bar reads top (max) to bottom (min), so the gradient stops run in reverse
                    color order to match how colors map to values in the heatmap cells. */}
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    {colors.map((_, i) => (
                        <stop
                            key={i}
                            offset={`${(i / (colors.length - 1)) * 100}%`}
                            stopColor={colors[colors.length - 1 - i]}
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
                            fontFamily={FONT_FAMILY}
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
