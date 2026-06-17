import React, { useId } from "react";
import { Group } from "@visx/group";
import { Text } from "@visx/text";
import { BackgroundGradient } from "./types";

type GradientLegendProps = {
    backgroundGradient: BackgroundGradient;
    boundedHeight: number;
    barLeft: number;
    marginTop: number;
};

const GradientLegend = ({ backgroundGradient, boundedHeight, barLeft, marginTop }: GradientLegendProps) => {
    const gradId = `sg-${useId().replace(/:/g, "")}`;
    const [colorLow, colorMid, colorHigh] = backgroundGradient.colorScale ?? ["red", "white", "blue"];
    const { label, minLabel, midLabel, maxLabel } = backgroundGradient.legend!;

    return (
        <>
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colorHigh} />
                    <stop offset="50%" stopColor={colorMid} />
                    <stop offset="100%" stopColor={colorLow} />
                </linearGradient>
            </defs>
            <Group top={marginTop} left={barLeft}>
                <rect x={0} y={0} width={16} height={boundedHeight} fill={`url(#${gradId})`} stroke="#aaa" strokeWidth={0.5} />
                <line x1={16} x2={22} y1={0} y2={0} stroke="#555" strokeWidth={1} />
                <line x1={16} x2={22} y1={boundedHeight / 2} y2={boundedHeight / 2} stroke="#555" strokeWidth={1} />
                <line x1={16} x2={22} y1={boundedHeight} y2={boundedHeight} stroke="#555" strokeWidth={1} />
                {maxLabel && <text x={26} y={0} dy="0.35em" fontSize={10} fill="#1c1917">{maxLabel}</text>}
                <text x={26} y={boundedHeight / 2} dy="0.35em" fontSize={10} fill="#1c1917">{midLabel ?? "0"}</text>
                {minLabel && <text x={26} y={boundedHeight} dy="0.35em" fontSize={10} fill="#1c1917">{minLabel}</text>}
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
