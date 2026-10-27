/** One axis of the view: cell i's leading edge shows at `scale * i + translate`, in CSS px from the grid's edge. */
export type ViewAxis = { scale: number; translate: number };
export type View = { x: ViewAxis; y: ViewAxis };

/** What bounds an axis: how many cells, the room they're shown in, and the largest a cell may grow. */
export type AxisSpan = { cells: number; size: number; maxCell: number };
export type Spans = { x: AxisSpan; y: AxisSpan };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const fitScale = ({ cells, size }: AxisSpan) => size / cells;

/** From every cell fitting to cells maxCell across - or no zoom at all, where they fit larger than that. */
const scaleLimits = (span: AxisSpan) => [fitScale(span), Math.max(fitScale(span), span.maxCell)] as const;

export const fitView = ({ x, y }: Spans): View => ({
  x: { scale: fitScale(x), translate: 0 },
  y: { scale: fitScale(y), translate: 0 },
});

/** Panned no further than the cells reach, so they always fill the axis. */
const held = ({ scale, translate }: ViewAxis, span: AxisSpan): ViewAxis => ({
  scale,
  translate: clamp(translate, Math.min(0, span.size - scale * span.cells), 0),
});

/**
 * The axis zoomed by `factor` from `start`, keeping the cell that was at `from` at `to`: a pinch's
 * midpoint as it moves, or with `to` left out, a wheel's pointer. Each axis stops at its own limits.
 */
export const zoomAxis = (start: ViewAxis, span: AxisSpan, factor: number, from: number, to = from): ViewAxis => {
  const [min, max] = scaleLimits(span);
  const scale = clamp(start.scale * factor, min, max);
  const cell = (from - start.translate) / start.scale;
  return held({ scale, translate: to - scale * cell }, span);
};

export type Point = { x: number; y: number };
/** Which axes a gesture zooms: over the grid both, over one axis's labels that one alone. */
export type Axes = "both" | "x" | "y";

/** The view zoomed along `axes`, each as zoomAxis zooms it. */
export const zoomView = (view: View, spans: Spans, axes: Axes, factor: number, from: Point, to = from): View => ({
  x: axes === "y" ? view.x : zoomAxis(view.x, spans.x, factor, from.x, to.x),
  y: axes === "x" ? view.y : zoomAxis(view.y, spans.y, factor, from.y, to.y),
});

export const panAxis =(axis: ViewAxis, span: AxisSpan, delta: number): ViewAxis =>
  held({ scale: axis.scale, translate: axis.translate + delta }, span);

/** The axis with cell `cell` in the middle, at its zoom. */
export const centerAxis = (axis: ViewAxis, span: AxisSpan, cell: number): ViewAxis =>
  held({ scale: axis.scale, translate: span.size / 2 - axis.scale * cell }, span);

/** The same zoom, relative to fitting, and the same middle cell, in a resized span. */
export const resizeAxis = (axis: ViewAxis, from: AxisSpan, to: AxisSpan): ViewAxis => {
  const [min, max] = scaleLimits(to);
  const scale = clamp((axis.scale / fitScale(from)) * fitScale(to), min, max);
  const middle = (from.size / 2 - axis.translate) / axis.scale;
  return held({ scale, translate: to.size / 2 - scale * middle }, to);
};

export const isFit = (axis: ViewAxis, span: AxisSpan) => axis.scale <= scaleLimits(span)[0] * (1 + 1e-6);
export const isFullyZoomed = (axis: ViewAxis, span: AxisSpan) => axis.scale >= scaleLimits(span)[1] * (1 - 1e-6);

/** The cells at least partly in view, as [first, end). */
export const visibleCells = ({ scale, translate }: ViewAxis, { cells, size }: AxisSpan) =>
  [Math.max(0, Math.floor(-translate / scale)), Math.min(cells, Math.ceil((size - translate) / scale))] as const;

/** The cell at a position along the axis, or -1 past the cells. */
export const cellAt = ({ scale, translate }: ViewAxis, cells: number, position: number) => {
  const cell = Math.floor((position - translate) / scale);
  return cell >= 0 && cell < cells ? cell : -1;
};

/**
 * Partway from one view to another, zooming about the one place on screen the two views share, so
 * it stays put throughout - panning alone where they're at the same zoom. The zoom eases
 * geometrically, so it reads as steady.
 */
export const between = (from: View, to: View, t: number): View => {
  const axis = (a: ViewAxis, b: ViewAxis): ViewAxis => {
    if (Math.abs(b.scale - a.scale) < 1e-9 * a.scale) return { scale: a.scale, translate: a.translate + (b.translate - a.translate) * t };
    // The cell both views show at the same place, and that place.
    const cell = (b.translate - a.translate) / (a.scale - b.scale);
    const still = a.scale * cell + a.translate;
    const scale = a.scale * (b.scale / a.scale) ** t;
    return { scale, translate: still - scale * cell };
  };
  return { x: axis(from.x, to.x), y: axis(from.y, to.y) };
};
