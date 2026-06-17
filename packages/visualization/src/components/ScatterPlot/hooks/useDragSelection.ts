import { useCallback, useState } from "react";
import { useDrag } from "@visx/drag";
import { HandlerArgs } from "@visx/drag/lib/useDrag";
import { ScaleLinear } from "@visx/vendor/d3-scale";
import { Line, Lines, Point, ZoomType } from "../types";
import { isPointInLasso, rescaleX, rescaleY } from "../helpers";

type UseDragSelectionProps<T extends object> = {
    pointData: Point<T>[];
    margin: { top: number; left: number };
    xScale: ScaleLinear<number, number, never>;
    yScale: ScaleLinear<number, number, never>;
    onSelectionChange?: (selectedPoints: Point<T>[]) => void;
};

export const useDragSelection = <T extends object>({
    pointData,
    margin,
    xScale,
    yScale,
    onSelectionChange,
}: UseDragSelectionProps<T>) => {
    const [lines, setLines] = useState<Lines>([]);

    const onDragStart = useCallback((currDrag: HandlerArgs) => {
        if (currDrag?.x === undefined || currDrag?.y === undefined) return;
        const startX = currDrag.x;
        const startY = currDrag.y;

        setLines((currLines) => [
            ...currLines,
            [{ x: startX - margin.left, y: startY - margin.top }],
        ]);
    }, [margin.left, margin.top]);

    const onDragMove = useCallback((currDrag: HandlerArgs) => {
        if (currDrag?.x === undefined || currDrag?.y === undefined) return;

        const adjustedX = currDrag.x - margin.left;
        const adjustedY = currDrag.y - margin.top;
        setLines((currLines) => {
            const nextLines = [...currLines];
            const nextPoint = { x: adjustedX + currDrag.dx, y: adjustedY + currDrag.dy };
            const lastIndex = nextLines.length - 1;
            nextLines[lastIndex] = [...(nextLines[lastIndex] || []), nextPoint];
            return nextLines;
        });
    }, [margin.left, margin.top]);

    const completeSelection = useCallback((zoom: ZoomType) => {
        const lasso = lines[lines.length - 1];
        if (!lasso) {
            setLines([]);
            return;
        }

        const xScaleTransformed = rescaleX(xScale, zoom.transformMatrix.translateX, zoom.transformMatrix.scaleX);
        const yScaleTransformed = rescaleY(yScale, zoom.transformMatrix.translateY, zoom.transformMatrix.scaleY);

        const pointsInsideLasso = pointData.filter((point) => isPointInLasso({
            x: xScaleTransformed(point.x),
            y: yScaleTransformed(point.y),
        }, lasso as Line));

        onSelectionChange?.(pointsInsideLasso);
        setLines([]);
    }, [lines, onSelectionChange, pointData, xScale, yScale]);

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

    return { lines, isDragging, x, y, dx, dy, dragStart, dragMove, dragEnd, completeSelection };
};
