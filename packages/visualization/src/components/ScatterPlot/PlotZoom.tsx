import React, { ReactElement } from 'react';
import { Zoom as VisxZoom, ZoomProps } from '@visx/zoom';
import { ZoomType } from './types';

/**
 * Shared by every plot that creates a zoom, so a plot driving its own zoom and a plot driving a
 * shared one behave identically.
 */
export const initialTransformMatrix = {
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

type PlotZoomProps = {
    /**
     * Size of the zoomed area. Only used by visx to pick a default anchor point for operations
     * that have none of their own; the plots always pass an explicit one.
     */
    width: number;
    height: number;
    children: (zoom: ZoomType) => ReactElement;
};

const PlotZoom = ({ width, height, children }: PlotZoomProps) => (
    <Zoom
        width={width}
        height={height}
        {...ZOOM_SCALE_LIMITS}
        initialTransformMatrix={initialTransformMatrix}
    >
        {(zoom) => children(zoom as ZoomType)}
    </Zoom>
);

export default PlotZoom;
