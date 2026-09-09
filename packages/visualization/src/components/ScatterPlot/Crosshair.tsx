import { CrosshairPosition } from "./types";

export const CROSSHAIR_STROKE = "#666";
export const CROSSHAIR_STROKE_WIDTH = 1;
/** Dash pattern in pixels. Kept as numbers so the minimap can scale it to match. */
export const CROSSHAIR_DASH = [2, 2];

type CrosshairProps = {
    /** Crosshair position in pixels, relative to the top left of the plot area. */
    position: CrosshairPosition;
    boundedWidth: number;
    boundedHeight: number;
};

/**
 * Thin lines spanning the plot area through the crosshair position.
 *
 * Each line is drawn only when its own axis is in view, so a crosshair mirrored from another
 * plot still shows the axis you can see rather than disappearing entirely.
 */
const Crosshair = ({ position, boundedWidth, boundedHeight }: CrosshairProps) => {
    const { x, y } = position;

    return (
        <>
            {y >= 0 && y <= boundedHeight && (
                <line
                    x1={0}
                    x2={boundedWidth}
                    y1={y}
                    y2={y}
                    stroke={CROSSHAIR_STROKE}
                    strokeWidth={CROSSHAIR_STROKE_WIDTH}
                    strokeDasharray={CROSSHAIR_DASH.join(",")}
                    pointerEvents="none"
                />
            )}
            {x >= 0 && x <= boundedWidth && (
                <line
                    x1={x}
                    x2={x}
                    y1={0}
                    y2={boundedHeight}
                    stroke={CROSSHAIR_STROKE}
                    strokeWidth={CROSSHAIR_STROKE_WIDTH}
                    strokeDasharray={CROSSHAIR_DASH.join(",")}
                    pointerEvents="none"
                />
            )}
        </>
    );
};

export default Crosshair;
