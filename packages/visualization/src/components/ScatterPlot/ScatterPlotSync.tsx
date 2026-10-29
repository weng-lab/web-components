import { ReactElement, useState } from 'react';
import { CrosshairPosition, ScatterPlotView } from './types';

/**
 * Props to spread onto each ScatterPlot being kept in sync.
 */
export type SyncedPlotProps = {
    view: ScatterPlotView | null;
    onViewChange: (view: ScatterPlotView) => void;
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
     * Domains for every synced plot, so each shows the same data zoomed all the way out, and so at
     * any zoom - pass getSharedDomains(...) over all the point sets, or your own known bounds.
     */
    xDomain?: [number, number];
    yDomain?: [number, number];
    /** Fixes every synced plot at this size rather than letting each fill its own container. */
    width?: number;
    height?: number;
};

/**
 * Links several scatter plots into one view: panning or zooming any of them moves all of them,
 * and hovering one draws the same crosshair on all of them.
 *
 * They share the view in their data's terms - the point at the middle of each plot, and how far
 * each is zoomed in - which each shows at its own size, so they can be any size, and resized one
 * apart from another. Pass the shared domains through.
 *
 * Only the hovered plot shows a tooltip - the mirrored crosshair is an overlay, and does not
 * trigger the other plots' hover behavior.
 */
const ScatterPlotSync = ({ children, xDomain, yDomain, width, height }: ScatterPlotSyncProps) => {
    const [view, setView] = useState<ScatterPlotView | null>(null);
    const [crosshairPosition, setCrosshairPosition] = useState<CrosshairPosition | null>(null);

    return children({
        view,
        onViewChange: setView,
        crosshair: true,
        crosshairPosition,
        onCrosshairChange: setCrosshairPosition,
        xDomain,
        yDomain,
        width,
        height,
    });
};

export default ScatterPlotSync;
