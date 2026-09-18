import { ScaleLinear } from "@visx/vendor/d3-scale";
import { Line, Point, PointShape, TransformMatrix } from "./types";

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

/**
 * Each shape is sized to cover the same area as a circle of the same `r`, rather than to the same
 * width. Without that, a shape encoding doubles as an unintended size encoding - an equilateral
 * triangle drawn to a circle's radius carries about 40% of its ink, so one category reads as
 * consistently fainter than another for no reason present in the data.
 *
 * Each constant below solves `area(shape) = πr²` for that shape's defining dimension:
 *
 *   square    half-side h,       4h² = πr²           ->  h = √π / 2        ≈ 0.886
 *   triangle  circumradius R,    (3√3/4)R² = πr²     ->  R = √(4π/3√3)    ≈ 1.555
 *   cross     half-span a, arms a/3 wide, (20/9)a² = πr²  ->  a = √(9π/20) ≈ 1.189
 *
 * The diamond, the inverted triangle and the X need no constants of their own: each is a
 * rotation or a reflection of one of the above, and neither operation changes area.
 */
const SQUARE_HALF_SIDE = Math.sqrt(Math.PI) / 2;
const TRIANGLE_CIRCUMRADIUS = Math.sqrt((4 * Math.PI) / (3 * Math.sqrt(3)));
const CROSS_HALF_SPAN = Math.sqrt((9 * Math.PI) / 20);
const CROSS_HALF_WIDTH = CROSS_HALF_SPAN / 3;

type UnitVertices = readonly (readonly [number, number])[];

/** Apex up, the three vertices sitting on the circumscribed circle. */
const TRIANGLE_VERTICES: UnitVertices = [
    [0, -TRIANGLE_CIRCUMRADIUS],
    [(TRIANGLE_CIRCUMRADIUS * Math.sqrt(3)) / 2, TRIANGLE_CIRCUMRADIUS / 2],
    [-(TRIANGLE_CIRCUMRADIUS * Math.sqrt(3)) / 2, TRIANGLE_CIRCUMRADIUS / 2],
];

const SQUARE_VERTICES: UnitVertices = [
    [-SQUARE_HALF_SIDE, -SQUARE_HALF_SIDE],
    [SQUARE_HALF_SIDE, -SQUARE_HALF_SIDE],
    [SQUARE_HALF_SIDE, SQUARE_HALF_SIDE],
    [-SQUARE_HALF_SIDE, SQUARE_HALF_SIDE],
];

/** A plus sign, traced clockwise from the top-left corner of the upper arm. */
const CROSS_VERTICES: UnitVertices = [
    [-CROSS_HALF_WIDTH, -CROSS_HALF_SPAN],
    [CROSS_HALF_WIDTH, -CROSS_HALF_SPAN],
    [CROSS_HALF_WIDTH, -CROSS_HALF_WIDTH],
    [CROSS_HALF_SPAN, -CROSS_HALF_WIDTH],
    [CROSS_HALF_SPAN, CROSS_HALF_WIDTH],
    [CROSS_HALF_WIDTH, CROSS_HALF_WIDTH],
    [CROSS_HALF_WIDTH, CROSS_HALF_SPAN],
    [-CROSS_HALF_WIDTH, CROSS_HALF_SPAN],
    [-CROSS_HALF_WIDTH, CROSS_HALF_WIDTH],
    [-CROSS_HALF_SPAN, CROSS_HALF_WIDTH],
    [-CROSS_HALF_SPAN, -CROSS_HALF_WIDTH],
    [-CROSS_HALF_WIDTH, -CROSS_HALF_WIDTH],
];

/** Turns a vertex list about the origin. Area is unchanged, so the normalisation carries over. */
const rotate = (vertices: UnitVertices, radians: number): UnitVertices => {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return vertices.map(([x, y]) => [x * cos - y * sin, x * sin + y * cos]);
};

/** Mirrors a vertex list about the x axis, which likewise leaves area alone. */
const flipVertically = (vertices: UnitVertices): UnitVertices => vertices.map(([x, y]) => [x, -y]);

/**
 * Vertices of each shape at r = 1, centred on the origin, in the y-down coordinates both canvas
 * and SVG use - so one set of vertices drives both renderers and they cannot drift apart.
 */
const UNIT_VERTICES: Record<Exclude<PointShape, "circle">, UnitVertices> = {
    triangle: TRIANGLE_VERTICES,
    triangleDown: flipVertically(TRIANGLE_VERTICES),
    square: SQUARE_VERTICES,
    // A square stood on its corner - which is exactly the half-diagonal √(π/2) the area solves to.
    diamond: rotate(SQUARE_VERTICES, Math.PI / 4),
    cross: CROSS_VERTICES,
    x: rotate(CROSS_VERTICES, Math.PI / 4),
};

/**
 * The polygon a shape is drawn as, centred on (cx, cy) at radius r, or null for a circle - which
 * has no vertices and is drawn as an arc by whichever renderer asked.
 */
export const getShapeVertices = (
    shape: PointShape | undefined,
    cx: number,
    cy: number,
    r: number
): [number, number][] | null => {
    if (!shape || shape === "circle") return null;
    // Guards an unknown shape from a JS caller, which would otherwise throw rather than degrade.
    const unit = UNIT_VERTICES[shape];
    if (!unit) return null;
    return unit.map(([x, y]) => [cx + x * r, cy + y * r]);
};

/** The same polygon as an SVG `points` string, or null for a circle. */
export const getShapePoints = (shape: PointShape | undefined, cx: number, cy: number, r: number) => {
    const vertices = getShapeVertices(shape, cx, cy, r);
    return vertices ? vertices.map(([x, y]) => `${x},${y}`).join(" ") : null;
};

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

/** How a hovered point is set apart from the rest. */
export type HoverStyle = {
    /** Radius added at full hover, in pixels. */
    growth: number;
    /** Color of the ring drawn around a hovered point. */
    stroke: string;
};

export const DEFAULT_HOVER_STYLE: HoverStyle = { growth: 2, stroke: "black" };

export const drawCanvasPoint = <T extends object>(
    context: CanvasRenderingContext2D,
    point: Point<T>,
    x: number,
    y: number,
    /** How far into its hover growth this point is: 0 at rest, 1 fully hovered. */
    hoverAmount: number,
    hoverStyle: HoverStyle = DEFAULT_HOVER_STYLE
) => {
    const size = (point.r || 3) + hoverStyle.growth * hoverAmount;
    context.beginPath();

    const vertices = getShapeVertices(point.shape, x, y, size);
    if (vertices) {
        vertices.forEach(([vx, vy], index) => (index === 0 ? context.moveTo(vx, vy) : context.lineTo(vx, vy)));
        context.closePath();
    } else {
        context.arc(x, y, size, 0, Math.PI * 2);
    }

    context.fillStyle = point.color ? point.color : "black";
    context.globalAlpha = point.opacity !== undefined ? point.opacity : 1;
    context.fill();

    if (hoverAmount > 0 || point.stroke) {
        context.lineWidth = 1;
        if (hoverAmount > 0) {
            // Fade the hover ring in alongside the growth. Snapping it to full opacity on the
            // first frame reads as a flicker against a point that is still growing.
            context.strokeStyle = hoverStyle.stroke;
            context.globalAlpha = (point.opacity ?? 1) * hoverAmount;
        } else {
            context.strokeStyle = point.stroke!;
        }
        context.stroke();
    }
};
