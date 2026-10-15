/**
 * Where point labels go: each beside its point on a short leader line, placed one at a time so
 * that no label lies over another, over a labeled point, or outside the plot area.
 */

/** A labeled point as it sits on screen: its center and radius in plot-area pixels. */
export type LabelAnchor = { x: number; y: number; r: number; label: string };

export type LabelPlacement = {
    /** The leader line, from the point's edge out to the text. */
    line: { x1: number; y1: number; x2: number; y2: number };
    /** Where the text is anchored, and by which end. Vertically, by its middle. */
    text: { x: number; y: number; anchor: "start" | "end" };
};

type Box = { left: number; right: number; top: number; bottom: number };

/** How far past its point's edge a leader runs. The shortest that leaves the label clear is used. */
const LEADER_LENGTHS = [12, 27, 42];
/** Turns away from the preferred direction, nearest first: either side of it, then round to the opposite. */
const TURNS = [0, 1, -1, 2, -2, 3, -3, 4].map((eighths) => (eighths * Math.PI) / 4);
/** Room between the end of the leader and the text. */
const TEXT_GAP = 4;
/** The label's 11px bold text, estimated - the font is the page's, so it can't be measured here. */
const CHARACTER_WIDTH = 7;
const TEXT_HEIGHT = 13;
/** Room kept clear around each label, so two never touch. */
const CLEARANCE = 2;

const overlaps = (a: Box, b: Box) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/**
 * A placement for each anchor, in the order given, or null for a label there is no clear room
 * for - which is left off, to come back once a zoom or a pan has made room. Earlier anchors are
 * placed first and so are the last to be left off.
 *
 * Each label is tried pointing away from the center of the plot, as an unobstructed label does,
 * then turned by eighths either way, on the shortest leader before the longer ones.
 */
export const placeLabels = (anchors: readonly LabelAnchor[], width: number, height: number): (LabelPlacement | null)[] => {
    // Every labeled point is kept clear from the start, including those whose labels come later.
    const markers: Box[] = anchors.map(({ x, y, r }) => ({ left: x - r, right: x + r, top: y - r, bottom: y + r }));
    const placed: Box[] = [];

    return anchors.map(({ x, y, r, label }) => {
        const outward = Math.atan2(y - height / 2, x - width / 2);
        const textWidth = label.length * CHARACTER_WIDTH;

        for (const length of LEADER_LENGTHS) {
            for (const turn of TURNS) {
                const cos = Math.cos(outward + turn);
                const sin = Math.sin(outward + turn);
                const endX = x + cos * (r + length);
                const endY = y + sin * (r + length);
                const anchor = cos >= 0 ? "start" : "end";
                const textX = endX + (anchor === "start" ? TEXT_GAP : -TEXT_GAP);
                const box: Box = {
                    left: (anchor === "start" ? textX : textX - textWidth) - CLEARANCE,
                    right: (anchor === "start" ? textX + textWidth : textX) + CLEARANCE,
                    top: endY - TEXT_HEIGHT / 2 - CLEARANCE,
                    bottom: endY + TEXT_HEIGHT / 2 + CLEARANCE,
                };

                if (box.left < 0 || box.right > width || box.top < 0 || box.bottom > height) continue;
                if (placed.some((other) => overlaps(box, other)) || markers.some((marker) => overlaps(box, marker))) continue;

                placed.push(box);
                return {
                    line: { x1: x + cos * r, y1: y + sin * r, x2: endX, y2: endY },
                    text: { x: textX, y: endY, anchor },
                };
            }
        }
        return null;
    });
};
