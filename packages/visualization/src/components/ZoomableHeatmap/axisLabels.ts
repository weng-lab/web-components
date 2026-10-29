import { measureTextWidth, truncateToWidth } from "../../utility";

export const LABEL_FONT_SIZE = 11;
export const LABEL_FONT_FAMILY = "sans-serif";
/** How far apart labels must sit across their axis to be read. */
export const LABEL_LINE = 14;

const measure = (text: string) => measureTextWidth(text, LABEL_FONT_SIZE, LABEL_FONT_FAMILY);

/** The widest of `names`, in the label font. */
export const widestLabel = (names: readonly string[]) => names.reduce((widest, name) => Math.max(widest, measure(name)), 0);

/** Marked cells whose labels would collide, labeled once at `at`: the middle of the first and last. */
export type LabelGroup = { at: number; members: number[] };

/**
 * Which cells in [first, end) get a label. Every k-th, k the least power of two that keeps labels
 * LABEL_LINE apart, so the labels already shown stay put as zooming in fills in more between them.
 * And every `marked` cell, those whose labels would collide grouped under one label, with any k-th
 * label crowding a group dropped.
 */
export function axisLabels(first: number, end: number, cellSize: number, marked: ReadonlySet<number>) {
  const groups: LabelGroup[] = [];
  const inView = [...marked].filter((cell) => cell >= first && cell < end).sort((a, b) => a - b);
  for (const cell of inView) {
    const last = groups[groups.length - 1];
    if (last && (cell - last.members[last.members.length - 1]) * cellSize < LABEL_LINE) last.members.push(cell);
    else groups.push({ at: cell, members: [cell] });
  }
  for (const group of groups) group.at = (group.members[0] + group.members[group.members.length - 1]) / 2;

  const step = 2 ** Math.max(0, Math.ceil(Math.log2(LABEL_LINE / cellSize)));
  const cells: number[] = [];
  for (let cell = Math.ceil(first / step) * step; cell < end; cell += step) {
    if (marked.has(cell) || groups.some(({ at }) => Math.abs(cell - at) * cellSize < LABEL_LINE)) continue;
    cells.push(cell);
  }
  return { cells, groups };
}

const fitted = new Map<string, string>();

/** `text` cut short with "…" to fit `width` px, whole where it fits. */
export function fitLabel(text: string, width: number): string {
  const key = `${width}\u0000${text}`;
  const cached = fitted.get(key);
  if (cached !== undefined) return cached;
  const result = truncateToWidth(text, width, LABEL_FONT_SIZE, LABEL_FONT_FAMILY);
  if (fitted.size > 20_000) fitted.clear();
  fitted.set(key, result);
  return result;
}
