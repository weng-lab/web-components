import React from "react";
import { motion } from "framer-motion";
import { ScaleLinear } from "@visx/vendor/d3-scale";
import { AnimationType, getAnimationProps } from "../../utility";
import { DimStyle, Point } from "./types";
import { getShapePoints } from "./helpers";

type AnimatedPointsProps<T extends object> = {
    pointData: Point<T>[];
    dimStyle: DimStyle;
    animation: AnimationType;
    animationGroupSize?: number;
    animationBuffer?: number;
    xScaleTransformed: ScaleLinear<number, number, never>;
    yScaleTransformed: ScaleLinear<number, number, never>;
    boundedWidth: number;
    boundedHeight: number;
};

const AnimatedPoints = <T extends object>({
    pointData,
    dimStyle,
    animation,
    animationGroupSize,
    animationBuffer,
    xScaleTransformed,
    yScaleTransformed,
    boundedWidth,
    boundedHeight,
}: AnimatedPointsProps<T>) => (
    <g>
        {pointData.map((point, index) => {
            const Wrapper = motion.g;
            const groupIndex = Math.floor(index / (animationGroupSize ?? 1));
            const animationProps = getAnimationProps(animation, groupIndex, animationBuffer ?? 0.03);
            const cx = xScaleTransformed(point.x);
            const cy = yScaleTransformed(point.y);
            if (cx < 0 || cx > boundedWidth || cy < 0 || cy > boundedHeight) return null;
            const radius = point.r ?? 3;
            // The same vertices the canvas renderer draws from, so a point does not change shape
            // or size as the entry animation hands over to the canvas.
            const shapePoints = getShapePoints(point.shape, cx, cy, radius);
            const fill = point.dimmed ? dimStyle.color : point.color ?? "black";
            const opacity = point.dimmed ? dimStyle.opacity : point.opacity ?? 1;
            return (
                <Wrapper key={`pt-${index}`} {...animationProps}>
                    {shapePoints ? (
                        <polygon points={shapePoints} fill={fill} stroke={point.stroke} opacity={opacity} />
                    ) : (
                        <circle
                            cx={cx}
                            cy={cy}
                            r={radius}
                            fill={fill}
                            stroke={point.stroke}
                            opacity={opacity}
                        />
                    )}
                </Wrapper>
            );
        })}
    </g>
);

export default AnimatedPoints;
