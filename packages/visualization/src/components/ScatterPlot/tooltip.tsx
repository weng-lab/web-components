import { Point } from "./types";

/**
 * What the tooltip shows when a consumer gives no `tooltipBody`: whatever is in the point's
 * metadata, one field per line.
 *
 * Positioning is not this component's concern - PlotTooltip owns it, so every plot in the
 * library places its tooltip the same way.
 */
const DefaultTooltipBody = <T,>({ point }: { point: Point<T> }) => (
    <div>
        {point.metaData && Object.entries(point.metaData).map(([key, value]) => (
            <div key={key}>
                <strong>{key.charAt(0).toUpperCase() + key.slice(1)}: </strong>
                {typeof value === 'string'
                    ? (value.length > 45
                        ? `${value.replace(/_/g, " ").slice(0, 45)}...`
                        : value.replace(/_/g, " "))
                    : String(value)}
            </div>
        ))}
    </div>
);

export default DefaultTooltipBody;
