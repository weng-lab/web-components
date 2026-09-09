import { ReactElement, useState } from 'react';
import { CrosshairPosition, ZoomType } from './types';
import PlotZoom from './PlotZoom';

/**
 * Props to spread onto each ScatterPlot being kept in sync.
 */
export type SyncedPlotProps = {
    zoom: ZoomType;
    crosshair: true;
    crosshairPosition: CrosshairPosition | null;
    onCrosshairChange: (position: CrosshairPosition | null) => void;
    xDomain?: [number, number];
    yDomain?: [number, number];
    width?: number;
    height?: number;
};

export type ScatterPlotSyncProps = {
    /**
     * Renders the plots, given the props that link them together.
     *
     * @example
     * const domains = useMemo(() => getSharedDomains(dataA, dataB), [dataA, dataB]);
     *
     * <ScatterPlotSync {...domains}>
     *   {(sync) => (
     *     <Stack direction="row">
     *       <ScatterPlot pointData={dataA} loading={false} {...sync} />
     *       <ScatterPlot pointData={dataB} loading={false} {...sync} />
     *     </Stack>
     *   )}
     * </ScatterPlotSync>
     */
    children: (sync: SyncedPlotProps) => ReactElement;
    /**
     * Domains for every synced plot. The shared zoom transform is in pixels, so plots only line
     * up if they map data onto those pixels the same way - pass getSharedDomains(...) over all
     * the point sets, or your own known bounds.
     */
    xDomain?: [number, number];
    yDomain?: [number, number];
    /**
     * Fixes every synced plot at this size rather than letting each fill its own container.
     *
     * The shared zoom transform is in pixels, so synced plots have to be the same size. Passing
     * a size here guarantees that; leaving it out keeps the plots responsive, and it is then on
     * the layout to give them equally sized containers.
     */
    width?: number;
    height?: number;
};

/**
 * Links several scatter plots into one view: they share a zoom transform, so panning or zooming
 * any of them moves all of them, and they share a crosshair, so hovering one draws the same
 * crosshair on all of them.
 *
 * The plots must be the same size and share their domains for their pixels to mean the same
 * thing. Lay them out in equally sized containers (or give them explicit matching width/height)
 * and pass the shared domains through.
 *
 * Only the hovered plot shows a tooltip - the mirrored crosshair is an overlay, and does not
 * trigger the other plots' hover behaviour.
 */
const ScatterPlotSync = ({ children, xDomain, yDomain, width, height }: ScatterPlotSyncProps) => {
    const [crosshairPosition, setCrosshairPosition] = useState<CrosshairPosition | null>(null);

    return (
        // The size given to visx here only picks a default anchor point for operations that have
        // none of their own, which ScatterPlot never relies on - it always passes its own.
        <PlotZoom width={width ?? 0} height={height ?? 0}>
            {(zoom) => children({
                zoom,
                crosshair: true,
                crosshairPosition,
                onCrosshairChange: setCrosshairPosition,
                xDomain,
                yDomain,
                width,
                height,
            })}
        </PlotZoom>
    );
};

export default ScatterPlotSync;
