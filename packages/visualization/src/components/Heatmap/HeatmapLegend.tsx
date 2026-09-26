import { useId } from "react";
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
    /** The bar's length: the column's height standing up beside the grid, the band's width lying across the minimap. */
    length: number;
    orientation?: "vertical" | "horizontal";
}

/** Room a lying-down legend takes: the bar, its ticks, and a line of labels under them. */
export const HORIZONTAL_LEGEND_HEIGHT = BAR_WIDTH + TICK_WIDTH + LABEL_GAP + FONT_SIZE + 2;

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

const HeatmapLegend = ({ colors, minValue, maxValue, length, orientation = "vertical" }: HeatmapLegendProps) => {
    // Per instance: the expanded minimap draws a second legend while the first stays beside the grid.
    const gradientId = `heatmap-legend-gradient-${useId().replace(/:/g, "")}`;
    const horizontal = orientation === "horizontal";
    const tickValues = getTickValues(minValue, maxValue);

    // Standing up, the bar reads top (max) to bottom (min); lying down, left (min) to right (max).
    const scale = scaleLinear<number>({
        domain: horizontal ? [minValue, maxValue] : [maxValue, minValue],
        range: [0, length],
    });

    return (
        <Group>
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2={horizontal ? "1" : "0"} y2={horizontal ? "0" : "1"}>
                    {colors.map((_, i) => (
                        <stop
                            key={i}
                            offset={`${(i / (colors.length - 1)) * 100}%`}
                            // Top to bottom standing up, so the stops run in reverse color order.
                            stopColor={horizontal ? colors[i] : colors[colors.length - 1 - i]}
                        />
                    ))}
                </linearGradient>
            </defs>
            <rect
                x={0}
                y={0}
                width={horizontal ? length : BAR_WIDTH}
                height={horizontal ? BAR_WIDTH : length}
                fill={`url(#${gradientId})`}
                rx={2}
            />
            {tickValues.map((value, i) => {
                const at = scale(value);
                const [tickStart, tickEnd, labelAt] = [BAR_WIDTH, BAR_WIDTH + TICK_WIDTH, BAR_WIDTH + TICK_WIDTH + LABEL_GAP];
                return (
                    <g key={i}>
                        <line
                            x1={horizontal ? at : tickStart}
                            x2={horizontal ? at : tickEnd}
                            y1={horizontal ? tickStart : at}
                            y2={horizontal ? tickEnd : at}
                            stroke="#4d4f52"
                            strokeWidth={1}
                        />
                        <text
                            x={horizontal ? at : labelAt}
                            y={horizontal ? labelAt : at}
                            dominantBaseline={horizontal ? "hanging" : "middle"}
                            // Lying down, the end labels keep inside the bar's ends rather than hang past them.
                            textAnchor={!horizontal || i === 0 ? "start" : i === tickValues.length - 1 ? "end" : "middle"}
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
