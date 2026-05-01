import React, { useCallback, useMemo, useRef, useState } from "react";
import { localPoint } from "@visx/event";
import { useDrag } from "@visx/drag";
import { HandlerArgs } from "@visx/drag/lib/useDrag";
import { Line, Lines, Point, SelectionMode, ZoomType } from "./types";
import { isPointInLasso, rescaleX, rescaleY } from "./helpers";
import { ScaleLinear } from "@visx/vendor/d3-scale";

type PlotMargin = {
    top: number;
    left: number;
};

type UseScatterPlotInteractionProps<T extends object> = {
    pointData: Point<T>[];
    selectable: boolean;
    initialSelectionMode: SelectionMode;
    initialMiniMapOpen: boolean;
    margin: PlotMargin;
    xScale: ScaleLinear<number, number, never>;
    yScale: ScaleLinear<number, number, never>;
    onSelectionChange?: (selectedPoints: Point<T>[]) => void;
    onPointClicked?: (point: Point<T>) => void;
};

type TransformedPointCache<T extends object> = {
    pointData: Point<T>[];
    translateX: number;
    translateY: number;
    scaleX: number;
    scaleY: number;
    points: Array<{
        point: Point<T>;
        x: number;
        y: number;
    }>;
};

export const useScatterPlotInteraction = <T extends object>({
    pointData,
    selectable,
    initialSelectionMode,
    initialMiniMapOpen,
    margin,
    xScale,
    yScale,
    onSelectionChange,
    onPointClicked,
}: UseScatterPlotInteractionProps<T>) => {
    const graphRef = useRef<SVGRectElement | null>(null);
    const [tooltipData, setTooltipData] = useState<Point<T> | null>(null);
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const [lines, setLines] = useState<Lines>([]);
    const [selectMode, setSelectMode] = useState<SelectionMode>(initialSelectionMode);
    const [showMiniMap, setShowMiniMap] = useState(initialMiniMapOpen);
    const [mouseX, setMouseX] = useState(0);
    const [mouseY, setMouseY] = useState(0);
    const transformedPointCacheRef = useRef<TransformedPointCache<T> | null>(null);

    const hoveredPoint = useMemo(
        () => tooltipData
            ? pointData.find((point) => point.x === tooltipData.x && point.y === tooltipData.y) ?? null
            : null,
        [pointData, tooltipData]
    );

    const handleSelectionModeChange = useCallback((mode: SelectionMode) => {
        setSelectMode(mode);
    }, []);

    const toggleMiniMap = useCallback(() => {
        setShowMiniMap((curr) => !curr);
    }, []);

    const onDragStart = useCallback((currDrag: HandlerArgs) => {
        if (selectMode !== "select" || currDrag?.x === undefined || currDrag?.y === undefined) return;
        const startX = currDrag.x;
        const startY = currDrag.y;

        setLines((currLines) => [
            ...currLines,
            [{ x: startX - margin.left, y: startY - margin.top }],
        ]);
    }, [margin.left, margin.top, selectMode]);

    const onDragMove = useCallback((currDrag: HandlerArgs) => {
        if (selectMode !== "select" || currDrag?.x === undefined || currDrag?.y === undefined) return;

        const adjustedX = currDrag.x - margin.left;
        const adjustedY = currDrag.y - margin.top;
        setLines((currLines) => {
            const nextLines = [...currLines];
            const nextPoint = { x: adjustedX + currDrag.dx, y: adjustedY + currDrag.dy };
            const lastIndex = nextLines.length - 1;
            nextLines[lastIndex] = [...(nextLines[lastIndex] || []), nextPoint];
            return nextLines;
        });
    }, [margin.left, margin.top, selectMode]);

    const completeSelection = useCallback((zoom: ZoomType) => {
        if (selectMode !== "select") {
            setLines([]);
            return;
        }

        const lasso = lines[lines.length - 1];
        if (!lasso) return;

        const xScaleTransformed = rescaleX(xScale, zoom.transformMatrix.translateX, zoom.transformMatrix.scaleX);
        const yScaleTransformed = rescaleY(yScale, zoom.transformMatrix.translateY, zoom.transformMatrix.scaleY);

        const pointsInsideLasso = pointData.filter((point) => isPointInLasso({
            x: xScaleTransformed(point.x),
            y: yScaleTransformed(point.y),
        }, lasso as Line));

        onSelectionChange?.(pointsInsideLasso);
        setLines([]);
    }, [lines, onSelectionChange, pointData, selectMode, xScale, yScale]);

    const {
        x = 0,
        y = 0,
        dx,
        dy,
        isDragging,
        dragStart,
        dragEnd,
        dragMove,
    } = useDrag({
        onDragStart,
        onDragMove,
        resetOnStart: true,
    });

    const handleMouseMove = useCallback((event: React.MouseEvent<SVGElement>, zoom: ZoomType) => {
        if (isDragging || zoom.isDragging) {
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
        //cache tranformed points for faster hover lookup times (more for larger datasets)
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
    }, [isDragging, margin.left, margin.top, pointData, xScale, yScale]);

    const handleMouseLeave = useCallback(() => {
        setTooltipOpen(false);
        setTooltipData(null);
    }, []);

    const handlePointClick = useCallback(() => {
        if (hoveredPoint) {
            onPointClicked?.(hoveredPoint);
        }
    }, [hoveredPoint, onPointClicked]);

    return {
        graphRef,
        tooltipData,
        tooltipOpen,
        lines,
        selectMode,
        showMiniMap,
        mouseX,
        mouseY,
        hoveredPoint,
        isDragging,
        x,
        y,
        dx,
        dy,
        dragStart,
        dragEnd,
        dragMove,
        handleSelectionModeChange,
        toggleMiniMap,
        completeSelection,
        handleMouseMove,
        handleMouseLeave,
        handlePointClick,
    };
};
