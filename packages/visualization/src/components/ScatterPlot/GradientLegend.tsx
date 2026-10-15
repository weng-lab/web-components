import React, { useId } from "react";
import { Group } from "@visx/group";
import { Text } from "@visx/text";

/** A mark along the bar, `at` from 0 at its low end to 1 at its high end. */
export type GradientLegendTick = { at: number; label?: string };

type GradientLegendProps = {
    /** The bar's colors from its low end to its high end, spaced evenly. */
    colors: readonly string[];
    ticks: GradientLegendTick[];
    label?: string;
    boundedHeight: number;
    barLeft: number;
    marginTop: number;
};

const GradientLegend = ({ colors, ticks, label, boundedHeight, barLeft, marginTop }: GradientLegendProps) => {
    const gradId = `sg-${useId().replace(/:/g, "")}`;

    return (
        <>
            <defs>
                {/* Drawn top-down, so the high end comes first. */}
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    {colors.map((color, index) => (
                        <stop
                            key={index}
                            offset={colors.length > 1 ? 1 - index / (colors.length - 1) : 0}
                            stopColor={color}
                        />
                    )).reverse()}
                </linearGradient>
            </defs>
            <Group top={marginTop} left={barLeft}>
                <rect x={0} y={0} width={16} height={boundedHeight} fill={`url(#${gradId})`} stroke="#aaa" strokeWidth={0.5} />
                {ticks.map(({ at, label: tickLabel }, index) => {
                    const y = (1 - at) * boundedHeight;
                    return (
                        <React.Fragment key={index}>
                            <line x1={16} x2={22} y1={y} y2={y} stroke="#555" strokeWidth={1} />
                            {tickLabel && <text x={26} y={y} dy="0.35em" fontSize={10} fill="#1c1917">{tickLabel}</text>}
                        </React.Fragment>
                    );
                })}
                {label && (
                    <Text textAnchor="middle" verticalAnchor="end" angle={90} fontSize={14} y={boundedHeight / 2} x={0} dx={65}>
                        {label}
                    </Text>
                )}
            </Group>
        </>
    );
};

export default GradientLegend;
