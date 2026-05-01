import { ScaleLinear } from "@visx/vendor/d3-scale";
import { Line, Point } from "./types";

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
    return Array.from({ length: total }, (_, i) => min + i * step);
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
    isHovered: boolean
) => {
    const size = (point.r || 3) + (isHovered ? 2 : 0);
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

    if (isHovered) {
        context.lineWidth = 1;
        context.strokeStyle = "black";
        context.stroke();
    }
};
