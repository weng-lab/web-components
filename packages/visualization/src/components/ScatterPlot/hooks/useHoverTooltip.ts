import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { localPoint } from "@visx/event";
import { ScaleLinear } from "@visx/vendor/d3-scale";
import { Point, ZoomType } from "../types";
import { rescaleX, rescaleY } from "../helpers";
import { useStableCallback } from "../../../hooks";
import type { PlotTooltipRef } from "../../../tooltip";

type UseHoverTooltipProps<T extends object> = {
    pointData: Point<T>[];
    margin: { top: number; left: number };
    xScale: ScaleLinear<number, number, never>;
    yScale: ScaleLinear<number, number, never>;
    onHoveredPointChange?: (point: Point<T> | null) => void;
    /**
     * The plot's tooltip, driven directly rather than through state.
     *
     * The pointer position is the tooltip's business alone, and holding it here would re-render
     * the whole plot on every mousemove across it - thousands of points and every axis - to move
     * a box that renders itself. Only the hovered point is state, and that changes on entering
     * and leaving a point rather than on every move.
     */
    tooltipRef: PlotTooltipRef<Point<T>>;
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
    tooltipRef,
}: UseHoverTooltipProps<T>) => {
    const [tooltipData, setTooltipData] = useState<Point<T> | null>(null);
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

    // Announce the hover as ended when the plot unmounts, so a consumer driving highlight state
    // of its own - a legend entry, a linked chart - isn't left lit for a plot that is gone.
    // Kept apart from the effect above, whose cleanup would otherwise fire on every transition.
    useEffect(() => () => {
        if (publishedPointRef.current !== null) publishHoverChange(null);
    }, [publishHoverChange]);

    const handleMouseMove = useCallback((event: React.MouseEvent<SVGElement>, zoom: ZoomType) => {
        if (zoom.isDragging) {
            tooltipRef.current?.hide();
            setTooltipData(null);
            return;
        }

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

        // React bails out when the point is unchanged, so this only re-renders the plot when the
        // cursor enters or leaves one. The tooltip follows the cursor through its own ref
        // instead, which re-renders nothing but the tooltip.
        setTooltipData(nextHoveredPoint);
        if (nextHoveredPoint) tooltipRef.current?.show(nextHoveredPoint, event);
        else tooltipRef.current?.hide();
    }, [margin.left, margin.top, pointData, xScale, yScale, tooltipRef]);

    const handleMouseLeave = useCallback(() => {
        tooltipRef.current?.hide();
        setTooltipData(null);
    }, [tooltipRef]);

    return { hoveredPoint, handleMouseMove, handleMouseLeave };
};
