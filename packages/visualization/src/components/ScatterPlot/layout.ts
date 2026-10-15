import { GRADIENT_LEGEND_WIDTH } from "./GradientLegend";

export const MARGIN = { top: 20, right: 20, bottom: 70, left: 70 };

/** Unsquared, a gradient legend takes the right margin in place of the default one. */
const LEGEND_MARGIN = { ...MARGIN, right: GRADIENT_LEGEND_WIDTH };

/**
 * Padding around each control button's small (20px) icon. In pixels rather than theme spacing,
 * since the gutter below is held back to fit it exactly.
 */
export const CONTROL_BUTTON_PADDING = 6;

/** The control panel's width: an icon, its padding, and the panel's 1px border either side. */
export const CONTROLS_WIDTH = 20 + CONTROL_BUTTON_PADDING * 2 + 2;

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

export type PlotLayout = {
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
    /** Whether a gradient legend is drawn to the right of the plot area. */
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

    // The panel sits just outside whatever is drawn on its side: the box on the left, and the box
    // or a legend hanging past it on the right.
    const controlsBeside = (left: number, contentRight: number) =>
        controls === "left"
            ? left - CONTROLS_GAP - CONTROLS_WIDTH
            : controls === "right"
                ? contentRight + CONTROLS_GAP
                : null;

    if (!square) {
        // The plot takes the whole width left beside the panel, and only the axis margins (and
        // the legend, if there is one) are held back.
        const margin = legend ? LEGEND_MARGIN : MARGIN;
        return {
            left: gutterLeft,
            width: available,
            height: parentHeight,
            margin,
            boundedWidth: Math.max(0, available - margin.left - margin.right),
            boundedHeight: Math.max(0, parentHeight - margin.top - margin.bottom),
            controlsLeft: controlsBeside(gutterLeft, gutterLeft + available),
        };
    }

    // The square path keeps its original proportions - a plot area of 0.9 of the box, less the
    // left margin, on both axes - so it only differs from previous versions where the panel or
    // the legend would otherwise have been drawn over it.
    //
    // A legend hangs past the box by however much it outgrows the box's own right margin, a tenth
    // of the box. Below ten legends wide that overhang grows as the box shrinks, so the largest box
    // that fits is solved for rather than read off.
    const overhang = (size: number) => (legend ? Math.max(0, GRADIENT_LEGEND_WIDTH - size * 0.1) : 0);
    const widest = legend && available < GRADIENT_LEGEND_WIDTH * 10
        ? (available - GRADIENT_LEGEND_WIDTH) / 0.9
        : available;
    const size = Math.max(0, Math.min(parentHeight, widest));
    const bounded = Math.max(0, size * 0.9 - MARGIN.left);

    // Centred in the container where there's room, and pushed clear of the panel where there isn't.
    const centred = (parentWidth - size) / 2;
    const left = Math.max(gutterLeft, Math.min(centred, parentWidth - gutterRight - size - overhang(size)));

    return {
        left,
        width: size,
        height: size,
        margin: MARGIN,
        boundedWidth: bounded,
        boundedHeight: bounded,
        controlsLeft: controlsBeside(left, left + size + overhang(size)),
    };
};
