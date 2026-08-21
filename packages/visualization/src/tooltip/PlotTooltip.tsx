import { memo, useImperativeHandle, useState, MouseEvent, ReactNode, Ref, RefObject } from "react";
import { Portal, TooltipWithBounds } from "@visx/tooltip";

/** Offset from the pointer, so the tooltip never sits directly under the cursor. */
const POINTER_OFFSET = 10;

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
}

interface PlotTooltipState<T> {
  open: boolean;
  data?: T;
  left: number;
  top: number;
}

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
 * with each mark doing `onMouseMove={(e) => tooltipRef.current?.show(bin, e)}`.
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
 */
function PlotTooltip<T>({ ref, children }: PlotTooltipProps<T>) {
  const [state, setState] = useState<PlotTooltipState<T>>({ open: false, left: 0, top: 0 });

  useImperativeHandle(ref, () => ({
    show: (data, event) =>
      setState({ open: true, data, left: event.pageX + POINTER_OFFSET, top: event.pageY + POINTER_OFFSET }),
    hide: () => setState((current) => (current.open ? { ...current, open: false } : current)),
  }), []);

  if (!state.open || state.data === undefined) return null;

  return (
    <Portal>
      <TooltipWithBounds left={state.left} top={state.top}>
        {children(state.data)}
      </TooltipWithBounds>
    </Portal>
  );
}

// memo() doesn't preserve generic type parameters, so cast back to the generic signature
export default memo(PlotTooltip) as typeof PlotTooltip;
