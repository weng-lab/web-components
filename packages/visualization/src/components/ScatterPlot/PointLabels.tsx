import React from "react";
import { Group } from "@visx/group";
import { ScaleLinear } from "@visx/vendor/d3-scale";
import { Point } from "./types";

type PointLabelsProps<T extends object> = {
    pointData: Point<T>[];
    xScaleTransformed: ScaleLinear<number, number, never>;
    yScaleTransformed: ScaleLinear<number, number, never>;
    boundedWidth: number;
    boundedHeight: number;
    margin: { top: number; left: number };
};

const PointLabels = <T extends object>({
    pointData,
    xScaleTransformed,
    yScaleTransformed,
    boundedWidth,
    boundedHeight,
    margin,
}: PointLabelsProps<T>) => {
    if (!pointData.some(p => p.label)) return null;

    return (
        <Group top={margin.top} left={margin.left}>
            {pointData.map((point, i) => {
                if (!point.label) return null;
                const cx = xScaleTransformed(point.x);
                const cy = yScaleTransformed(point.y);
                if (cx < 0 || cx > boundedWidth || cy < 0 || cy > boundedHeight) return null;

                const lineLen = 15;
                const estTextWidth = point.label.length * 7;
                const circleR = (point.r ?? 3);
                const angle = Math.atan2(cy - boundedHeight / 2, cx - boundedWidth / 2);
                let cosA = Math.cos(angle);
                let sinA = Math.sin(angle);

                // Flip horizontal if text would overflow left/right
                const lxRaw = cx + cosA * lineLen;
                const textEndX = cosA >= 0 ? lxRaw + 4 + estTextWidth : lxRaw - 4 - estTextWidth;
                if (textEndX > boundedWidth || textEndX < 0) cosA = -cosA;

                // Flip vertical if line endpoint would overflow top/bottom
                const lyRaw = cy + sinA * lineLen;
                if (lyRaw < 0 || lyRaw > boundedHeight) sinA = -sinA;

                const lx = cx + cosA * lineLen;
                const ly = cy + sinA * lineLen;
                const anchor = cosA >= 0 ? "start" : "end";

                return (
                    <g key={`lbl-${i}`} pointerEvents="none">
                        <line x1={cx + cosA * circleR} y1={cy + sinA * circleR} x2={lx} y2={ly} stroke="#555" strokeWidth={1} />
                        <text x={lx + (cosA >= 0 ? 4 : -4)} y={ly} textAnchor={anchor} dominantBaseline="middle" fontSize={11} fontWeight="bold" fill="#1c1917">
                            {point.label}
                        </text>
                    </g>
                );
            })}
        </Group>
    );
};

export default PointLabels;
