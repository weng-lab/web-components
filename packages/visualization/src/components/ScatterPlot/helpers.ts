import { ScaleLinear } from "@visx/vendor/d3-scale";
import { Line, Point, TransformMatrix } from "./types";

//rescale x and y scales when zooming
//converts to pixel values before applying transformations
export const rescaleX = (scale: ScaleLinear<number, number, never>, translateX: number, scaleX: number) => {
    const newXDomain = scale
        .range()
        .map((r) =>
            scale.invert(
                (r - translateX) / scaleX
            )
        );
    return scale.copy().domain(newXDomain);
};

export const rescaleY = (scale: ScaleLinear<number, number, never>, translateY: number, scaleY: number) => {
    const newXDomain = scale
        .range()
        .map((r) =>
            scale.invert(
                (r - translateY) / scaleY
            )
        );
    return scale.copy().domain(newXDomain);
};

//Invert a zoom-transformed scale at a pixel position without building a rescaled copy.
//Equivalent to rescaleX(scale, translate, scaleFactor).invert(pixel) for linear scales, but
//allocation-free - this runs on every mouse move.
export const invertRescaled = (
    scale: ScaleLinear<number, number, never>,
    translate: number,
    scaleFactor: number,
    pixel: number
) => scale.invert((pixel - translate) / scaleFactor);

//find all points within the drawn lasso for selection purposes
export const isPointInLasso = (point: { x: number; y: number }, lasso: Line): boolean => {
    let inside = false;
    //itterate through lasso, j starting at last point (closing the polygon) and taking the value of the previous point on subsequent calls
    for (let i = 0, j = lasso.length - 1; i < lasso.length; j = i++) {
        const xi = lasso[i].x, yi = lasso[i].y; //current vertex
        const xj = lasso[j].x, yj = lasso[j].y; //previous vertex

        //ray tracing using imaginary horizontal ray coming from the point extending to the right
        const intersect = ((yi > point.y) !== (yj > point.y)) && //does the ray intersect the line segment from the current to the previous vertex?
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi); //is the point to the left of the segment?
        if (intersect) inside = !inside; //toggles everytime the ray intersects the lasso, if twice it will go back to false since it crossed the lasso twice
        //if the ray crosses the lasso an even amount of times -> outside, odd -> inside
    }
    return inside;
};

export const getTicks = (
    scale: ScaleLinear<number, number, never>,
    total = 5 // total ticks including endpoints
) => {
    const [min, max] = scale.domain();
    if (total < 2) return [min, max];

    const step = (max - min) / (total - 1);
    return Array.from({ length: total }, (_, i) => parseFloat((min + i * step).toPrecision(10)));
};

export function getTrianglePoints(cx: number, cy: number, r: number) {
    // equilateral triangle centered at cx, cy
    const height = r * Math.sqrt(3);

    const p1 = `${cx},${cy - (2 / 3) * height}`;
    const p2 = `${cx - r},${cy + (1 / 3) * height}`;
    const p3 = `${cx + r},${cy + (1 / 3) * height}`;

    return `${p1} ${p2} ${p3}`;
}

export const getPointExtents = <T extends object>(pointData: Point<T>[]) => {
    if (pointData.length === 0) {
        return {
            x: [0, 1] as [number, number],
            y: [0, 1] as [number, number],
        };
    }

    let minX = pointData[0].x;
    let maxX = pointData[0].x;
    let minY = pointData[0].y;
    let maxY = pointData[0].y;

    for (const point of pointData) {
        if (point.x < minX) minX = point.x;
        if (point.x > maxX) maxX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.y > maxY) maxY = point.y;
    }

    return {
        x: [minX, maxX] as [number, number],
        y: [minY, maxY] as [number, number],
    };
};

/**
 * Fraction of an axis' data range padded onto each side, so points never sit exactly on the
 * axis line. A fraction rather than a fixed amount because these plots carry everything from
 * genomic coordinates in the millions to PCA components around 1e-2, and any one constant
 * either vanishes against the former or swamps the latter.
 */
const DOMAIN_PADDING_FRACTION = 0.05;

/**
 * Pads one axis' extent. A zero range - every point sharing a coordinate, or a single point -
 * leaves no range to take a fraction of, so the pad falls back to the magnitude of the value
 * itself, and to 1 at the origin where there is no magnitude either.
 */
const padExtent = ([min, max]: [number, number]): [number, number] => {
    const spread = max - min;
    const pad = (spread > 0 ? spread : Math.abs(max) || 1) * DOMAIN_PADDING_FRACTION;
    return [min - pad, max + pad];
};

export const getDomains = (extents: { x: [number, number]; y: [number, number] }) => ({
    xDomain: padExtent(extents.x),
    yDomain: padExtent(extents.y),
});

/**
 * Domains covering every given set of points, for plots that share a coordinate space and so
 * need to share a coordinate frame - pass the result to each plot's xDomain/yDomain so a given
 * coordinate lands on the same pixel in all of them.
 *
 * Memoize the result: passing a fresh array on every render rebuilds each plot's scales.
 */
export const getSharedDomains = (...pointDataSets: readonly { x: number; y: number }[][]) => {
    const populated = pointDataSets.filter((points) => points.length > 0);
    if (populated.length === 0) return getDomains(getPointExtents([]));

    const merged = populated
        .map((points) => getPointExtents(points))
        .reduce((combined, extents) => ({
            x: [Math.min(combined.x[0], extents.x[0]), Math.max(combined.x[1], extents.x[1])] as [number, number],
            y: [Math.min(combined.y[0], extents.y[0]), Math.max(combined.y[1], extents.y[1])] as [number, number],
        }));

    return getDomains(merged);
};

/**
 * Value comparison for transform matrices. Reference comparison is not enough once a matrix can
 * come from outside the component (a shared zoom, a restored view) rather than only from visx.
 */
export const isSameTransform = (a: TransformMatrix, b: TransformMatrix) => (
    a.scaleX === b.scaleX &&
    a.scaleY === b.scaleY &&
    a.translateX === b.translateX &&
    a.translateY === b.translateY &&
    a.skewX === b.skewX &&
    a.skewY === b.skewY
);

export const prepareCanvas = (
    context: CanvasRenderingContext2D,
    width: number,
    height: number
) => {
    context.setTransform(2, 0, 0, 2, 0, 0);
    context.clearRect(0, 0, width, height);
};

export const isPointVisible = (
    x: number,
    y: number,
    width: number,
    height: number
) => (
    x >= 0 &&
    x <= width &&
    y >= 0 &&
    y <= height
);

export const partitionPointsByHover = <T extends object>(
    pointData: Point<T>[],
    hoveredPointKeys: Set<string>
) => ({
    nonHovered: pointData.filter((point) => !hoveredPointKeys.has(`${point.x},${point.y}`)),
    hovered: pointData.filter((point) => hoveredPointKeys.has(`${point.x},${point.y}`)),
});

export const drawCanvasPoint = <T extends object>(
    context: CanvasRenderingContext2D,
    point: Point<T>,
    x: number,
    y: number,
    /** How far into its hover growth this point is: 0 at rest, 1 fully hovered. */
    hoverAmount: number
) => {
    const size = (point.r || 3) + 2 * hoverAmount;
    context.beginPath();

    if (!point.shape || point.shape === "circle") {
        context.arc(x, y, size, 0, Math.PI * 2);
    } else if (point.shape === "triangle") {
        context.moveTo(x, y - size);
        context.lineTo(x - size, y + size);
        context.lineTo(x + size, y + size);
        context.closePath();
    }

    context.fillStyle = point.color ? point.color : "black";
    context.globalAlpha = point.opacity !== undefined ? point.opacity : 1;
    context.fill();

    if (hoverAmount > 0 || point.stroke) {
        context.lineWidth = 1;
        if (hoverAmount > 0) {
            // Fade the hover ring in alongside the growth. Snapping it to full black on the
            // first frame reads as a flicker against a point that is still growing.
            context.strokeStyle = "black";
            context.globalAlpha = (point.opacity ?? 1) * hoverAmount;
        } else {
            context.strokeStyle = point.stroke!;
        }
        context.stroke();
    }
};
