import { TooltipProps } from "./types";

/** What a violin's tooltip says, in the plot's PlotTooltip. */
const ViolinTooltip = <T,>({ data, pointTooltipBody }: TooltipProps<T>) => (
    <>
        {pointTooltipBody && data.point ? (
            pointTooltipBody(data.point)
        ) : (
            Object.entries(data as Record<string, unknown>).map(([key, value]) => {
                const formattedKey = key
                    .replace(/([a-z])([A-Z])/g, "$1 $2")
                    .replace(/^./, str => str.toUpperCase());

                if (key === "outlier") {
                    return (
                        <div key={key}>
                            <strong>{formattedKey}</strong>
                        </div>
                    );
                } else {
                    return (
                        <div key={key}>
                            <strong>{formattedKey}: </strong>
                            {typeof value === 'string'
                                ? (value.length > 45
                                    ? `${value.replace(/_/g, " ").slice(0, 45)}...`
                                    : value.replace(/_/g, " "))
                                : String(value)}
                        </div>
                    );
                }
            })
        )}
    </>
);

export default ViolinTooltip;
