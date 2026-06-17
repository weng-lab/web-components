import React from "react";
import { motion } from "framer-motion";
import { ScaleLinear } from "@visx/vendor/d3-scale";
import { AnimationType, getAnimationProps } from "../../utility";
import { Point } from "./types";
import { getTrianglePoints } from "./helpers";

type AnimatedPointsProps<T extends object> = {
    pointData: Point<T>[];
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
            return (
                <Wrapper key={`pt-${index}`} {...animationProps}>
                    {point.shape === "triangle" ? (
                        <polygon
                            points={getTrianglePoints(cx, cy, radius)}
                            fill={point.color ?? "black"}
                            stroke={point.stroke}
                            opacity={point.opacity ?? 1}
                        />
                    ) : (
                        <circle
                            cx={cx}
                            cy={cy}
                            r={radius}
                            fill={point.color ?? "black"}
                            stroke={point.stroke}
                            opacity={point.opacity ?? 1}
                        />
                    )}
                </Wrapper>
            );
        })}
    </g>
);

export default AnimatedPoints;
