import React, { useCallback, useMemo, useRef, useState } from "react";
import { localPoint } from "@visx/event";
import { ScaleLinear } from "@visx/vendor/d3-scale";
import { Point, ZoomType } from "../types";
import { rescaleX, rescaleY } from "../helpers";

type UseHoverTooltipProps<T extends object> = {
    pointData: Point<T>[];
    margin: { top: number; left: number };
    xScale: ScaleLinear<number, number, never>;
    yScale: ScaleLinear<number, number, never>;
};

type TransformedPointCache<T extends object> = {
    pointData: Point<T>[];
    translateX: number;
    translateY: number;
    scaleX: number;
    scaleY: number;
    points: Array<{ point: Point<T>; x: number; y: number }>;
};

export const useHoverTooltip = <T extends object>({
    pointData,
    margin,
    xScale,
    yScale,
}: UseHoverTooltipProps<T>) => {
    const [tooltipData, setTooltipData] = useState<Point<T> | null>(null);
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const [mouseX, setMouseX] = useState(0);
    const [mouseY, setMouseY] = useState(0);
    const transformedPointCacheRef = useRef<TransformedPointCache<T> | null>(null);

    const hoveredPoint = useMemo(
        () => tooltipData
            ? pointData.find((point) => point.x === tooltipData.x && point.y === tooltipData.y) ?? null
            : null,
        [pointData, tooltipData]
    );

    const handleMouseMove = useCallback((event: React.MouseEvent<SVGElement>, zoom: ZoomType) => {
        if (zoom.isDragging) {
            setTooltipOpen(false);
            setTooltipData(null);
            return;
        }

        setMouseX(event.pageX);
        setMouseY(event.pageY);

        const point = localPoint(event.currentTarget, event);
        if (!point) return;

        const adjustedX = point.x - margin.left;
        const adjustedY = point.y - margin.top;
        const { translateX, translateY, scaleX, scaleY } = zoom.transformMatrix;

        const cachedTransformedPoints = transformedPointCacheRef.current;
        const shouldReuseCachedPoints =
            cachedTransformedPoints &&
            cachedTransformedPoints.pointData === pointData &&
            cachedTransformedPoints.translateX === translateX &&
            cachedTransformedPoints.translateY === translateY &&
            cachedTransformedPoints.scaleX === scaleX &&
            cachedTransformedPoints.scaleY === scaleY;

        const transformedPoints = shouldReuseCachedPoints
            ? cachedTransformedPoints.points
            : (() => {
                const xScaleTransformed = rescaleX(xScale, translateX, scaleX);
                const yScaleTransformed = rescaleY(yScale, translateY, scaleY);
                const nextPoints = pointData.map((curr) => ({
                    point: curr,
                    x: xScaleTransformed(curr.x),
                    y: yScaleTransformed(curr.y),
                }));

                transformedPointCacheRef.current = {
                    pointData,
                    translateX,
                    translateY,
                    scaleX,
                    scaleY,
                    points: nextPoints,
                };

                return nextPoints;
            })();

        const threshold = 5;
        const nextHoveredPoint = transformedPoints.find((curr) => (
            Math.abs(adjustedX - curr.x) < threshold &&
            Math.abs(adjustedY - curr.y) < threshold
        ))?.point ?? null;

        setTooltipData(nextHoveredPoint);
        setTooltipOpen(Boolean(nextHoveredPoint));
    }, [margin.left, margin.top, pointData, xScale, yScale]);

    const handleMouseLeave = useCallback(() => {
        setTooltipOpen(false);
        setTooltipData(null);
    }, []);

    return { hoveredPoint, tooltipData, tooltipOpen, mouseX, mouseY, handleMouseMove, handleMouseLeave };
};
