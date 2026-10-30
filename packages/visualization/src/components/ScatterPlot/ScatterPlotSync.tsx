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
};

/**
 * Links several scatter plots into one view: panning or zooming any of them moves all of them,
 * and hovering one draws the same crosshair on all of them.
 *
 * They share the view in their data's terms - the point at the middle of each plot, and how far
 * each is zoomed in - which each shows at its own size, so they can be any size, and resized one
 * apart from another. Pass the shared domains through: new ones zoom the plots back out, as the view
 * was in the old ones' terms.
 *
 * Only the hovered plot shows a tooltip - the mirrored crosshair is an overlay, and does not
 * trigger the other plots' hover behavior.
 */
const ScatterPlotSync = ({ children, xDomain, yDomain }: ScatterPlotSyncProps) => {
    // By value, as a consumer may pass fresh arrays on every render.
    const domains = String([xDomain, yDomain]);
    const [shared, setShared] = useState<{ view: ScatterPlotView; domains: string } | null>(null);
    const [crosshairPosition, setCrosshairPosition] = useState<CrosshairPosition | null>(null);

    return children({
        view: shared?.domains === domains ? shared.view : null,
        onViewChange: (view) => setShared({ view, domains }),
        crosshair: true,
        crosshairPosition,
        onCrosshairChange: setCrosshairPosition,
        xDomain,
        yDomain,
    });
};

export default ScatterPlotSync;
