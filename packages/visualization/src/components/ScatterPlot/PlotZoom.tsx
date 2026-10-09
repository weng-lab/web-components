import React, { ReactElement, useCallback, useRef } from 'react';
import { Zoom as VisxZoom, ZoomProps } from '@visx/zoom';
import { TransformMatrix, ZoomType } from './types';
import { clampTranslate, isSameTransform } from './helpers';

/**
 * Shared by every plot that creates a zoom, so a plot driving its own zoom and a plot driving a
 * shared one behave identically.
 */
const initialTransformMatrix = {
    scaleX: 1,
    scaleY: 1,
    translateX: 0,
    translateY: 0,
    skewX: 0,
    skewY: 0,
};

const ZOOM_SCALE_LIMITS = {
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
    /**
     * Size of the zoomed area. Only used by visx to pick a default anchor point for operations
     * that have none of their own; the plots always pass an explicit one.
     */
    width: number;
    height: number;
    children: (zoom: ZoomType) => ReactElement;
};

const PlotZoom = ({ width, height, children }: PlotZoomProps) => {
    // The plot area the pan is held to, reported by the plots themselves (see ZoomType's
    // setPanExtent): a shared zoom is created before any of its plots has been measured. A ref,
    // as it is only read while a transform is being applied.
    const extentRef = useRef({ width: 0, height: 0 });
    const setPanExtent = useCallback((extentWidth: number, extentHeight: number) => {
        extentRef.current = { width: extentWidth, height: extentHeight };
    }, []);

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

        const { width: extentWidth, height: extentHeight } = extentRef.current;
        const held = {
            ...scaled,
            translateX: extentWidth > 0 ? clampTranslate(scaled.translateX, scaled.scaleX, extentWidth, scaleXMin) : scaled.translateX,
            translateY: extentHeight > 0 ? clampTranslate(scaled.translateY, scaled.scaleY, extentHeight, scaleYMin) : scaled.translateY,
        };
        // The same object where nothing moved, so dragging against the edge doesn't re-render the plot.
        return isSameTransform(held, previous) ? previous : held;
    }, []);

    return (
        <Zoom
            width={width}
            height={height}
            {...ZOOM_SCALE_LIMITS}
            constrain={constrain}
            initialTransformMatrix={initialTransformMatrix}
        >
            {(zoom) => children({ ...(zoom as ZoomType), setPanExtent })}
        </Zoom>
    );
};

export default PlotZoom;
