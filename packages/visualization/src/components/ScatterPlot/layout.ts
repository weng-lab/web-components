import { FIELD_LEGEND_GAP, FIELD_LEGEND_WIDTH } from "./backgroundField";
import { CONTROLS_WIDTH } from "./controls";

const MARGIN = { top: 20, right: 20, bottom: 70, left: 70 };

/** How far a backgroundField's legend reaches past the plot area's right edge. */
const LEGEND_REACH = FIELD_LEGEND_GAP + FIELD_LEGEND_WIDTH;

/** Unsquared, a legend takes the right margin in place of the default one. */
const LEGEND_MARGIN = { ...MARGIN, right: LEGEND_REACH };

/**
 * Squared, the plot area is this fraction of the box, less the left margin, on both axes. What's
 * left of the box past it is the right margin.
 */
const SQUARE_PLOT_FRACTION = 0.9;

/** Between the control panel and the container's edge. */
const CONTROLS_INSET = 10;

/** Between the control panel and the plot (or legend) beside it. */
const CONTROLS_GAP = 6;

/**
 * Width held back beside the plot for the control panel, so the panel has a lane of its own
 * rather than sitting over the axis on the left or the points on the right. The same on either
 * side, so synced plots with their panels on different sides keep plot areas of the same size.
 */
const CONTROLS_GUTTER = CONTROLS_INSET + CONTROLS_WIDTH + CONTROLS_GAP;

type PlotLayout = {
    /** The plot's box - the svg the axes and points are drawn in - within the container. */
    left: number;
    width: number;
    height: number;
    /** The plot area's offset within that box, and the space around it. */
    margin: typeof MARGIN;
    boundedWidth: number;
    boundedHeight: number;
    /** The control panel's left edge within the container, or null when there is no panel. */
    controlsLeft: number | null;
};

type PlotLayoutInput = {
    parentWidth: number;
    parentHeight: number;
    square: boolean;
    /** The side the control panel is on, or null when there is none. */
    controls: "left" | "right" | null;
    /** Whether a backgroundField legend is drawn to the right of the plot area. */
    legend: boolean;
};

/**
 * Where the plot, its control panel and its legend sit within the container. Each gets its own
 * space, so none of them is drawn over another.
 */
export const getPlotLayout = ({ parentWidth, parentHeight, square, controls, legend }: PlotLayoutInput): PlotLayout => {
    const gutterLeft = controls === "left" ? CONTROLS_GUTTER : 0;
    const gutterRight = controls === "right" ? CONTROLS_GUTTER : 0;
    const available = Math.max(0, parentWidth - gutterLeft - gutterRight);

    let plot: Omit<PlotLayout, "controlsLeft">;
    /** The right edge of whatever is drawn: the box, or a legend hanging past it. */
    let contentRight: number;

    if (!square) {
        // The plot takes the whole width left beside the panel, and only the axis margins (and
        // the legend, if there is one) are held back.
        const margin = legend ? LEGEND_MARGIN : MARGIN;
        plot = {
            left: gutterLeft,
            width: available,
            height: parentHeight,
            margin,
            boundedWidth: Math.max(0, available - margin.left - margin.right),
            boundedHeight: Math.max(0, parentHeight - margin.top - margin.bottom),
        };
        contentRight = gutterLeft + available;
    } else {
        // The square path keeps its original proportions, so it only differs from previous
        // versions where the panel or the legend would otherwise have been drawn over it.
        //
        // A legend hangs past the box by however much it outgrows the box's right margin. Below
        // the size where that margin fits it, the overhang grows as the box shrinks, so the
        // largest box that fits is solved for rather than read off.
        const rightMarginFraction = 1 - SQUARE_PLOT_FRACTION;
        const widest = legend && available < LEGEND_REACH / rightMarginFraction
            ? (available - LEGEND_REACH) / SQUARE_PLOT_FRACTION
            : available;
        const size = Math.max(0, Math.min(parentHeight, widest));
        const hang = legend ? Math.max(0, LEGEND_REACH - size * rightMarginFraction) : 0;
        const bounded = Math.max(0, size * SQUARE_PLOT_FRACTION - MARGIN.left);

        // Centred in the container where there's room, and pushed clear of the panel where there isn't.
        const centred = (parentWidth - size) / 2;
        const left = Math.max(gutterLeft, Math.min(centred, parentWidth - gutterRight - size - hang));

        plot = {
            left,
            width: size,
            height: size,
            margin: {
                ...MARGIN,
                right: size - MARGIN.left - bounded,
                bottom: size - MARGIN.top - bounded,
            },
            boundedWidth: bounded,
            boundedHeight: bounded,
        };
        contentRight = left + size + hang;
    }

    // The panel sits just outside whatever is drawn on its side.
    const controlsLeft = controls === "left"
        ? plot.left - CONTROLS_GAP - CONTROLS_WIDTH
        : controls === "right"
            ? contentRight + CONTROLS_GAP
            : null;

    return { ...plot, controlsLeft };
};
