import React, { useMemo } from "react";
import { Group } from "@visx/group";
import { ScaleLinear } from "@visx/vendor/d3-scale";
import { Point } from "./types";
import { placeLabels } from "./labelPlacement";

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
    const labeled = useMemo(() => pointData.filter((point) => point.label), [pointData]);

    // Laid out together rather than each on its own, so that no two labels land on each other -
    // see placeLabels. Only the labels in view take part, so one off screen holds no room.
    const labels = useMemo(() => {
        const anchors = labeled
            .map((point) => ({
                x: xScaleTransformed(point.x),
                y: yScaleTransformed(point.y),
                r: point.r ?? 3,
                label: point.label!,
            }))
            .filter(({ x, y }) => x >= 0 && x <= boundedWidth && y >= 0 && y <= boundedHeight);
        return placeLabels(anchors, boundedWidth, boundedHeight).map((placement, i) => ({
            placement,
            label: anchors[i].label,
        }));
    }, [labeled, xScaleTransformed, yScaleTransformed, boundedWidth, boundedHeight]);

    if (labeled.length === 0) return null;

    return (
        <Group top={margin.top} left={margin.left}>
            {labels.map(({ placement, label }, i) => placement && (
                <g key={`lbl-${i}`} pointerEvents="none">
                    <line {...placement.line} stroke="#555" strokeWidth={1} />
                    <text x={placement.text.x} y={placement.text.y} textAnchor={placement.text.anchor} dominantBaseline="middle" fontSize={11} fontWeight="bold" fill="#1c1917">
                        {label}
                    </text>
                </g>
            ))}
        </Group>
    );
};

export default PointLabels;
