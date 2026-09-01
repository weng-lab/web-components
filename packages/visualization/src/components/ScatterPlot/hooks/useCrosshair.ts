import React, { useCallback, useEffect, useRef, useState } from "react";
import { localPoint } from "@visx/event";
import { ScaleLinear } from "@visx/vendor/d3-scale";
import { CrosshairPosition, ZoomType } from "../types";
import { invertRescaled } from "../helpers";
import { useStableCallback } from "../../../hooks";

type UseCrosshairProps = {
    enabled: boolean;
    margin: { top: number; left: number };
    boundedWidth: number;
    boundedHeight: number;
    xScale: ScaleLinear<number, number, never>;
    yScale: ScaleLinear<number, number, never>;
    onCrosshairChange?: (position: CrosshairPosition | null) => void;
};

/**
 * Tracks the pointer as a crosshair position in data coordinates.
 *
 * Data coordinates rather than pixels because the position is also published to consumers, who
 * may mirror it onto another plot or feed it back in as a controlled position. Keeping one
 * currency means every plot showing this crosshair resolves it through its own scales and so
 * agrees with the others, even mid-zoom.
 *
 * The zoom transform arrives as an argument rather than a hook input because it only exists
 * inside the Zoom render prop, below where this hook is called.
 *
 * Moves are coalesced to one update per animation frame. A mouse can report positions faster
 * than the browser paints, and mousemove is a continuous event that React flushes synchronously,
 * so publishing every one of them - into this state and, through onCrosshairChange, into a
 * parent shared by several plots - re-renders the whole group without ever yielding, and React
 * eventually warns about the update depth. Leaving is published immediately: it ends the
 * gesture, and a frame queued behind it would put the crosshair back.
 */
export const useCrosshair = ({
    enabled,
    margin,
    boundedWidth,
    boundedHeight,
    xScale,
    yScale,
    onCrosshairChange,
}: UseCrosshairProps) => {
    const [crosshairPosition, setCrosshairPosition] = useState<CrosshairPosition | null>(null);
    const publishedRef = useRef<CrosshairPosition | null>(null);
    const publishChange = useStableCallback(onCrosshairChange);

    const frameRef = useRef<number | null>(null);
    const pendingRef = useRef<CrosshairPosition | null>(null);

    const cancelFrame = useCallback(() => {
        if (frameRef.current === null) return;
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
    }, []);

    const apply = useCallback((position: CrosshairPosition | null) => {
        publishedRef.current = position;
        setCrosshairPosition(position);
        publishChange(position);
    }, [publishChange]);

    const publish = useCallback((position: CrosshairPosition | null) => {
        if (position === null) {
            cancelFrame();
            pendingRef.current = null;
            // Leaving the plot area fires on every subsequent move; only announce the first one.
            if (publishedRef.current === null) return;
            apply(null);
            return;
        }

        pendingRef.current = position;
        if (frameRef.current !== null) return;
        frameRef.current = requestAnimationFrame(() => {
            frameRef.current = null;
            const pending = pendingRef.current;
            pendingRef.current = null;
            if (pending) apply(pending);
        });
    }, [apply, cancelFrame]);

    useEffect(() => cancelFrame, [cancelFrame]);

    const handleCrosshairMove = useCallback((event: React.MouseEvent<SVGElement>, zoom: ZoomType) => {
        if (!enabled) return;

        const point = localPoint(event.currentTarget, event);
        if (!point) return;

        // The listener covers the whole svg, margins included, so anything outside the plot
        // area counts as leaving it.
        const plotX = point.x - margin.left;
        const plotY = point.y - margin.top;
        if (plotX < 0 || plotX > boundedWidth || plotY < 0 || plotY > boundedHeight) {
            publish(null);
            return;
        }

        const { translateX, translateY, scaleX, scaleY } = zoom.transformMatrix;
        publish({
            x: invertRescaled(xScale, translateX, scaleX, plotX),
            y: invertRescaled(yScale, translateY, scaleY, plotY),
        });
    }, [boundedHeight, boundedWidth, enabled, margin.left, margin.top, publish, xScale, yScale]);

    const handleCrosshairLeave = useCallback(() => {
        publish(null);
    }, [publish]);

    return { crosshairPosition, handleCrosshairMove, handleCrosshairLeave };
};
