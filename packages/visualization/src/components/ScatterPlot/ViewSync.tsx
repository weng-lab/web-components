import { useLayoutEffect, useRef } from "react";
import type { ScaleLinear } from "@visx/vendor/d3-scale";
import { isSameTransform } from "./helpers";
import type { ScatterPlotView, TransformMatrix, ZoomType } from "./types";

type Scale = ScaleLinear<number, number, never>;

const middle = (scale: Scale) => {
    const [start, end] = scale.range();
    return (start + end) / 2;
};

/** The view a transform shows on a plot with these scales. */
export const viewOf = ({ translateX, translateY, scaleX, scaleY }: TransformMatrix, xScale: Scale, yScale: Scale): ScatterPlotView => ({
    x: xScale.invert((middle(xScale) - translateX) / scaleX),
    y: yScale.invert((middle(yScale) - translateY) / scaleY),
    scaleX,
    scaleY,
});

/** The transform that shows a view on a plot with these scales. */
export const transformOf = (view: ScatterPlotView, current: TransformMatrix, xScale: Scale, yScale: Scale): TransformMatrix => ({
    ...current,
    scaleX: view.scaleX,
    scaleY: view.scaleY,
    translateX: middle(xScale) - view.scaleX * xScale(view.x),
    translateY: middle(yScale) - view.scaleY * yScale(view.y),
});

/** Within a hundredth of a pixel, so the round trip through data terms doesn't count as a move. */
const near = (a: TransformMatrix, b: TransformMatrix) =>
    Math.abs(a.translateX - b.translateX) < 0.01 &&
    Math.abs(a.translateY - b.translateY) < 0.01 &&
    Math.abs(a.scaleX - b.scaleX) < 1e-6 &&
    Math.abs(a.scaleY - b.scaleY) < 1e-6;

type ViewSyncProps = {
    zoom: ZoomType;
    view: ScatterPlotView | null;
    onViewChange?: (view: ScatterPlotView) => void;
    xScale: Scale;
    yScale: Scale;
};

/**
 * Keeps a plot's zoom on a view shared in data terms, and shares where the plot's own zoom moves to, so plots of any
 * size show the same part of the data. In layout effects, so a plot follows another within the frame it moved in.
 */
export const ViewSync = ({ zoom, view, onViewChange, xScale, yScale }: ViewSyncProps) => {
    const { transformMatrix, initialTransformMatrix, setTransformMatrix } = zoom;

    // Follows the shared view, and keeps to it as the plot is resized.
    useLayoutEffect(() => {
        if (!view) return;
        const target = transformOf(view, transformMatrix, xScale, yScale);
        if (!near(target, transformMatrix)) setTransformMatrix(target);
        // Not on the plot's own moves, which it shares instead.
    }, [view, xScale, yScale]);

    // Shares its own moves: a transform it has, other than the one it started with or the shared view's. A resize leaves
    // the transform as it was, so isn't taken for a move.
    const shared = useRef(transformMatrix);
    useLayoutEffect(() => {
        if (transformMatrix === shared.current) return;
        shared.current = transformMatrix;
        const unmoved = view
            ? near(transformOf(view, transformMatrix, xScale, yScale), transformMatrix)
            : isSameTransform(transformMatrix, initialTransformMatrix);
        if (!unmoved) onViewChange?.(viewOf(transformMatrix, xScale, yScale));
    }, [transformMatrix]);

    return null;
};
