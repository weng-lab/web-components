import { useMemo, useRef } from "react";
import { Point } from "../types";
import { pointKey } from "../helpers";

type UseHoveredPointKeysProps<T extends object> = {
    pointData: Point<T>[];
    /** The point under the cursor, which wins over hoveredPoints. */
    hoveredPoint: Point<T> | null;
    hoveredPoints?: Point<T>[];
    groupPointsAnchor?: keyof Point<T> | keyof T;
};

/**
 * The keys (see pointKey) of every point drawn as hovered: the point under the cursor if there is
 * one, otherwise whatever the consumer has asked to highlight, widened to whole groups by
 * groupPointsAnchor. The cursor takes precedence so the plot's own hover is never overridden
 * mid-gesture.
 */
export const useHoveredPointKeys = <T extends object>({
    pointData,
    hoveredPoint,
    hoveredPoints,
    groupPointsAnchor,
}: UseHoveredPointKeysProps<T>) => {
    const highlightSeeds: Point<T>[] = useMemo(
        () => (hoveredPoint ? [hoveredPoint] : hoveredPoints ?? []),
        [hoveredPoint, hoveredPoints]
    );

    const groupedPoints: Point<T>[] = useMemo(() => {
        const anchor = groupPointsAnchor;
        if (!anchor) return highlightSeeds;

        const anchorValue = (point: Point<T>): unknown =>
            anchor in point
                ? point[anchor as keyof Point<T>]
                : point.metaData?.[anchor as keyof T];

        // Collect the seeds' anchor values first, so this stays O(points + seeds). Matching each
        // point against each seed would be 2.5m comparisons when a whole 750-point group is
        // handed in against 3.4k points.
        const seedValues = new Set(
            highlightSeeds.map(anchorValue).filter((value) => value !== undefined)
        );
        if (seedValues.size === 0) return [];

        return pointData.filter((point) => {
            const value = anchorValue(point);
            return value !== undefined && seedValues.has(value);
        });
    }, [highlightSeeds, groupPointsAnchor, pointData]);

    const previousHoveredKeysRef = useRef<Set<string>>(new Set());

    return useMemo(() => {
        const next = new Set(groupedPoints.map(pointKey));
        const previous = previousHoveredKeysRef.current;

        // An unchanged set keeps its identity, so moving within one hovered group doesn't re-run
        // the redraw effect for every point the cursor crosses.
        if (next.size === previous.size && [...next].every((key) => previous.has(key))) {
            return previous;
        }

        previousHoveredKeysRef.current = next;
        return next;
    }, [groupedPoints]);
};
