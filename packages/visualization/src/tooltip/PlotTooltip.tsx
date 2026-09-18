import { memo, useCallback, useImperativeHandle, useRef, useState, MouseEvent, ReactNode, Ref, RefObject } from "react";
import { Portal, Tooltip, defaultStyles } from "@visx/tooltip";

/** Offset from the pointer, so the tooltip never sits directly under the cursor. */
const POINTER_OFFSET = 10;

/** Closest the tooltip may sit to a viewport edge when it fits on neither side of the pointer. */
const VIEWPORT_MARGIN = 8;

export interface PlotTooltipHandle<T> {
  /** Show the tooltip for `data`, positioned from the pointer event that triggered it. */
  show: (data: T, event: MouseEvent) => void;
  hide: () => void;
}

/**
 * The ref as marks receive it. Spelling out `RefObject<PlotTooltipHandle<T> | null>` in every
 * mark component is noisy and easy to get wrong (the `| null` is required - useRef(null) yields
 * a nullable current until PlotTooltip mounts).
 */
export type PlotTooltipRef<T> = RefObject<PlotTooltipHandle<T> | null>;

export interface PlotTooltipProps<T> {
  ref: Ref<PlotTooltipHandle<T>>;
  /** Renders the tooltip contents. Called here, not by the marks, so marks never depend on it. */
  children: (data: T) => ReactNode;
  /**
   * Stacking order for the tooltip. It is portalled to document.body, so it leaves the plot's
   * stacking context and cannot be layered against the plot's own overlays by DOM order alone -
   * a plot with controls or a minimap of its own needs to name a layer above them. visx ships no
   * z-index, which leaves the tooltip below anything positioned in the root stacking context.
   */
  zIndex?: number;
}

interface PlotTooltipState<T> {
  open: boolean;
  data?: T;
  left: number;
  top: number;
}

/**
 * Places the tooltip along one axis: offset from the pointer on the leading side, flipped to the
 * trailing side when the leading one would run off the end, and clamped when it fits on neither -
 * a tooltip larger than the viewport has no good side, so it is pinned rather than centred on a
 * pointer it cannot clear.
 */
const placeAlongAxis = (pointer: number, size: number, viewport: number) => {
  const leading = pointer + POINTER_OFFSET;
  const trailing = pointer - POINTER_OFFSET - size;
  const overflowsLeading = leading + size > viewport - VIEWPORT_MARGIN;
  const position = overflowsLeading && trailing >= VIEWPORT_MARGIN ? trailing : leading;
  return Math.max(VIEWPORT_MARGIN, Math.min(position, viewport - size - VIEWPORT_MARGIN));
};

/**
 * The tooltip's own size, kept current as its contents change.
 *
 * Watched rather than measured once, because the body is rebuilt for each mark the pointer
 * reaches and one with more to say is a taller box. visx's own `TooltipWithBounds` measures in
 * componentDidMount and never again, so moving between two marks without leaving the plot would
 * flip against the previous mark's size.
 *
 * A callback ref rather than an effect: the tooltip node comes and goes as the tooltip opens and
 * closes, and this attaches the observer exactly when there is something to observe. It runs in
 * the commit phase, so the measurement it takes lands before the browser paints.
 */
const useMeasuredSize = () => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const measureRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;

    const measure = () => {
      const { width, height } = node.getBoundingClientRect();
      setSize((current) =>
        current && current.width === width && current.height === height ? current : { width, height }
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  return [measureRef, size] as const;
};

/**
 * A single tooltip for a plot with many interactive marks (cells, bars, points, nodes).
 *
 * Render it as a *sibling* of the marks - never as an ancestor - and drive it through the ref:
 *
 *   const tooltipRef = useRef<PlotTooltipHandle<Bin>>(null);
 *   ...
 *   <Marks tooltipRef={tooltipRef} />
 *   <PlotTooltip ref={tooltipRef}>{(bin) => <div>{bin.count}</div>}</PlotTooltip>
 *
 * with each mark doing `onMouseMove={(e) => tooltipRef.current?.show(bin, e)}`. A canvas plot
 * with no mark elements calls the same handle from its own hit test.
 *
 * Why this shape:
 * - Tooltip state lives below the marks in the tree rather than above them, so showing, moving
 *   and hiding the tooltip re-renders only this component. Holding the state in the plot itself
 *   re-renders every mark on every mousemove; giving each mark its own useTooltip instead costs
 *   one state hook and one portal per mark.
 * - Marks receive only `tooltipRef`, which is stable for the lifetime of the plot. They never
 *   receive the tooltip body renderer, so an unstable one from a consumer cannot invalidate them.
 * - `show` takes the datum rather than rendered output, so nothing is rendered for marks the
 *   pointer never reaches.
 *
 * Positioned fixed, against viewport coordinates, which is what keeps it from ever giving the
 * page a scrollbar: a fixed box is laid out against the viewport and, unlike an absolutely
 * positioned one, is left out of the document's scrollable overflow entirely. So even in the
 * moment before it has been measured, or when it is too large to fit anywhere, the worst it can
 * do is sit partly off-screen - never widen the page under it. The measured flip is then about
 * readability rather than about scrollbars.
 */
function PlotTooltip<T>({ ref, children, zIndex }: PlotTooltipProps<T>) {
  const [state, setState] = useState<PlotTooltipState<T>>({ open: false, left: 0, top: 0 });
  const [measureRef, size] = useMeasuredSize();

  useImperativeHandle(ref, () => ({
    // Viewport coordinates rather than page ones, to match the fixed positioning below.
    show: (data, event) => setState({ open: true, data, left: event.clientX, top: event.clientY }),
    hide: () => setState((current) => (current.open ? { ...current, open: false } : current)),
  }), []);

  if (!state.open || state.data === undefined) return null;

  // Before the first measurement there is no size to place against. The callback ref measures
  // during the commit that adds the node, so this fallback is never a position the user sees.
  const left = size ? placeAlongAxis(state.left, size.width, window.innerWidth) : state.left + POINTER_OFFSET;
  const top = size ? placeAlongAxis(state.top, size.height, window.innerHeight) : state.top + POINTER_OFFSET;

  return (
    <Portal>
      <Tooltip
        ref={measureRef}
        left={left}
        top={top}
        // The pointer offset is applied above, against the measured size, so visx must not add
        // its own on top of it.
        offsetLeft={0}
        offsetTop={0}
        // Spread last so the viewport anchoring the placement depends on cannot be overridden by
        // the `position: absolute` in visx's default styles.
        style={{ ...defaultStyles, position: "fixed", zIndex }}
      >
        {children(state.data)}
      </Tooltip>
    </Portal>
  );
}

// memo() doesn't preserve generic type parameters, so cast back to the generic signature
export default memo(PlotTooltip) as typeof PlotTooltip;
