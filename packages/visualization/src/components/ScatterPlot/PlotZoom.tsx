import React, { ReactElement, useCallback } from 'react';
import { Zoom as VisxZoom, ZoomProps } from '@visx/zoom';
import { TransformMatrix, ZoomType } from './types';
import { clampTranslate, isSameTransform } from './helpers';

const initialTransformMatrix = {
    scaleX: 1,
    scaleY: 1,
    translateX: 0,
    translateY: 0,
    skewX: 0,
    skewY: 0,
};

export const ZOOM_SCALE_LIMITS = {
    scaleXMin: 1 / 2,
    scaleXMax: 10,
    scaleYMin: 1 / 2,
    scaleYMax: 10,
};

/**
 * Hacky workaround for complex type compatability issues. Hopefully this will fix itself when ugrading to React 19 - Jonathan 12/11/24
 * @todo remove this when possible
 */
const Zoom = VisxZoom as unknown as React.FC<ZoomProps<React.ReactElement>>;

/** How much of a step from one scale to another can be taken before it passes a limit: all of it (1) if it never does. */
const reachable = (previous: number, next: number, min: number, max: number) => {
    const limit = next < min ? min : next > max ? max : null;
    if (limit === null) return 1;
    return next === previous ? 0 : Math.min(1, Math.max(0, (limit - previous) / (next - previous)));
};

type PlotZoomProps = {
    /** The plot area: what panning is held inside of, and whose middle a zoom without a point of its own is about. */
    width: number;
    height: number;
    children: (zoom: ZoomType) => ReactElement;
};

const PlotZoom = ({ width, height, children }: PlotZoomProps) => {
    /**
     * Zooming is held to the scale limits, and panning to what the plot shows when zoomed all the
     * way out about its center - so the view can be dragged no further, at any zoom, than
     * zooming out would have shown anyway. Passing this replaces visx's own check of the scale
     * limits.
     *
     * A step that would pass a scale limit is cut short at it rather than refused, as visx would:
     * refused, the last step out never lands on the limit, and the view stops a little short of
     * fully zoomed out with room left to drag in.
     */
    const constrain = useCallback((next: TransformMatrix, previous: TransformMatrix) => {
        const { scaleXMin, scaleXMax, scaleYMin, scaleYMax } = ZOOM_SCALE_LIMITS;
        // A zoom about a point moves the scale and the translate in step, so stopping part of
        // the way along both keeps that point where it was.
        const fraction = Math.min(
            reachable(previous.scaleX, next.scaleX, scaleXMin, scaleXMax),
            reachable(previous.scaleY, next.scaleY, scaleYMin, scaleYMax)
        );
        const part = (from: number, to: number) => from + (to - from) * fraction;
        const scaled = fraction === 1 ? next : {
            ...next,
            scaleX: Math.min(Math.max(part(previous.scaleX, next.scaleX), scaleXMin), scaleXMax),
            scaleY: Math.min(Math.max(part(previous.scaleY, next.scaleY), scaleYMin), scaleYMax),
            translateX: part(previous.translateX, next.translateX),
            translateY: part(previous.translateY, next.translateY),
        };

        // Unmeasured, it pans freely.
        const held = {
            ...scaled,
            translateX: width > 0 ? clampTranslate(scaled.translateX, scaled.scaleX, width, scaleXMin) : scaled.translateX,
            translateY: height > 0 ? clampTranslate(scaled.translateY, scaled.scaleY, height, scaleYMin) : scaled.translateY,
        };
        // The same object where nothing moved, so dragging against the edge doesn't re-render the plot.
        return isSameTransform(held, previous) ? previous : held;
    }, [width, height]);

    return (
        <Zoom
            width={width}
            height={height}
            {...ZOOM_SCALE_LIMITS}
            constrain={constrain}
            initialTransformMatrix={initialTransformMatrix}
        >
            {(zoom) => children(zoom as ZoomType)}
        </Zoom>
    );
};

export default PlotZoom;
