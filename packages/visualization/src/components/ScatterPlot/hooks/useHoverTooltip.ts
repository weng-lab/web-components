import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { localPoint } from "@visx/event";
import { ScaleLinear } from "@visx/vendor/d3-scale";
import { Point, ZoomType } from "../types";
import { rescaleX, rescaleY } from "../helpers";
import { useStableCallback } from "../../../hooks";

type UseHoverTooltipProps<T extends object> = {
    pointData: Point<T>[];
    margin: { top: number; left: number };
    xScale: ScaleLinear<number, number, never>;
    yScale: ScaleLinear<number, number, never>;
    onHoveredPointChange?: (point: Point<T> | null) => void;
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
    onHoveredPointChange,
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

    // Published from an effect rather than the move handler because hoveredPoint is derived:
    // setTooltipData is called on every move and React discards the ones that do not change it,
    // so watching the derived value is what turns a stream of moves into enter/leave events.
    // The ref keeps that true when the effect itself is re-run without a real change.
    const publishHoverChange = useStableCallback(onHoveredPointChange);
    const publishedPointRef = useRef<Point<T> | null>(null);

    useEffect(() => {
        if (publishedPointRef.current === hoveredPoint) return;
        publishedPointRef.current = hoveredPoint;
        publishHoverChange(hoveredPoint);
    }, [hoveredPoint, publishHoverChange]);

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
