import { ScaleLinear } from "@visx/vendor/d3-scale";
import { Line } from "./types";

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
