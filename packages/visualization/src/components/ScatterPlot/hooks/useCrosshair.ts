import React, { useCallback, useRef, useState } from "react";
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

    const publish = useCallback((position: CrosshairPosition | null) => {
        // Leaving the plot area fires on every subsequent move; only announce the first one.
        if (position === null && publishedRef.current === null) return;
        publishedRef.current = position;
        setCrosshairPosition(position);
        publishChange(position);
    }, [publishChange]);

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
