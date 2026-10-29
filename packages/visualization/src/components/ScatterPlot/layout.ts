import { FIELD_LEGEND_GAP, FIELD_LEGEND_WIDTH } from "./backgroundField";
import { CONTROL_PANEL_WIDTH } from "../../controls";

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

/** Between the control panel and the container's edge: as far as the axis labels sit from it. */
const CONTROLS_EDGE = 6;

/** Between the control panel and the plot's box (or legend) beside it. */
const CONTROLS_GAP = 6;

/**
 * Between the control panel and the plot area on the right or under it, where the panel sits in the plot's empty
 * margin rather than beyond it.
 */
const CONTROLS_NEAR = 12;

/**
 * Room held back on each side for the control panel, so it has a lane of its own rather than sitting over the axis
 * on the left or the points on the right, and ends CONTROLS_EDGE from the container's edge. Beside the plot's box, as
 * on the left or past a legend, the lane takes the whole panel; on the right or over the plot, the panel reaches into
 * the plot's margin there, which the lane leaves out. A column of buttons is as wide as a row of them is tall.
 */
const BESIDE_LANE = CONTROLS_GAP + CONTROL_PANEL_WIDTH + CONTROLS_EDGE;
const RIGHT_LANE = CONTROLS_NEAR + CONTROL_PANEL_WIDTH + CONTROLS_EDGE - MARGIN.right;
const TOP_LANE = CONTROLS_NEAR + CONTROL_PANEL_WIDTH + CONTROLS_EDGE - MARGIN.top;

export type ControlsSide = "left" | "right" | "top";

type PlotLayout = {
    /** The plot's box - the svg the axes and points are drawn in - within the container. */
    left: number;
    top: number;
    width: number;
    height: number;
    /** The plot area's offset within that box, and the space around it. */
    margin: typeof MARGIN;
    boundedWidth: number;
    boundedHeight: number;
    /** The control panel's side and place within the container, or null when there is no panel. */
    controls: { side: ControlsSide; top: number; left?: number; right?: number } | null;
};

type PlotLayoutInput = {
    parentWidth: number;
    parentHeight: number;
    square: boolean;
    /**
     * The side the control panel is on, "auto" for whichever of the right and the top leaves room
     * for the bigger square plot area, or null when there is no panel.
     */
    controls: ControlsSide | "auto" | null;
    /** Whether a backgroundField legend is drawn to the right of the plot area. */
    legend: boolean;
};

/**
 * Where the plot, its control panel and its legend sit within the container. Each gets its own
 * space, so none of them is drawn over another.
 */
export const getPlotLayout = (input: PlotLayoutInput): PlotLayout => {
    if (input.controls !== "auto") return layOut({ ...input, controls: input.controls });
    // The right, unless the top leaves more room, as over a plot taller than it is wide.
    const right = layOut({ ...input, controls: "right" });
    const top = layOut({ ...input, controls: "top" });
    const squareSide = (layout: PlotLayout) => Math.min(layout.boundedWidth, layout.boundedHeight);
    return squareSide(top) > squareSide(right) ? top : right;
};

const layOut = ({ parentWidth, parentHeight, square, controls, legend }: PlotLayoutInput & { controls: ControlsSide | null }): PlotLayout => {
    const gutterLeft = controls === "left" ? BESIDE_LANE : 0;
    const gutterRight = controls === "right" ? (legend ? BESIDE_LANE : RIGHT_LANE) : 0;
    const gutterTop = controls === "top" ? TOP_LANE : 0;
    const available = Math.max(0, parentWidth - gutterLeft - gutterRight);
    const availableHeight = Math.max(0, parentHeight - gutterTop);

    let plot: Omit<PlotLayout, "top" | "controls">;
    /** The right edge of whatever is drawn: the box, or a legend hanging past it. */
    let contentRight: number;

    if (!square) {
        // The plot takes the whole width left beside the panel, and only the axis margins (and
        // the legend, if there is one) are held back.
        const margin = legend ? LEGEND_MARGIN : MARGIN;
        plot = {
            left: gutterLeft,
            width: available,
            height: availableHeight,
            margin,
            boundedWidth: Math.max(0, available - margin.left - margin.right),
            boundedHeight: Math.max(0, availableHeight - margin.top - margin.bottom),
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
        const size = Math.max(0, Math.min(availableHeight, widest));
        const hang = legend ? Math.max(0, LEGEND_REACH - size * rightMarginFraction) : 0;
        const bounded = Math.max(0, size * SQUARE_PLOT_FRACTION - MARGIN.left);

        // Centered in the container where there's room, and pushed clear of the panel where there isn't.
        const centered = (parentWidth - size) / 2;
        const left = Math.max(gutterLeft, Math.min(centered, parentWidth - gutterRight - size - hang));

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

    // The panel sits just outside whatever is drawn on its side: beside it, level with the plot area's top, or over
    // its right end.
    const plotRight = plot.left + plot.margin.left + plot.boundedWidth;
    const panels = {
        left: { left: plot.left - CONTROLS_GAP - CONTROL_PANEL_WIDTH, top: plot.margin.top },
        right: { left: legend ? contentRight + CONTROLS_GAP : plotRight + CONTROLS_NEAR, top: plot.margin.top },
        top: { right: parentWidth - plotRight, top: gutterTop + plot.margin.top - CONTROLS_NEAR - CONTROL_PANEL_WIDTH },
    };

    return { ...plot, top: gutterTop, controls: controls && { side: controls, ...panels[controls] } };
};
