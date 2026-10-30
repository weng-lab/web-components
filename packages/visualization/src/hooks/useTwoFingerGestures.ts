import { useEffect } from "react";
import { useStableCallback } from "./useStableCallback";

export type ClientPoint = { clientX: number; clientY: number };

export type TwoFingerGesture = {
  /** Midway between the two fingers when they came down. */
  from: ClientPoint;
  /** Midway between them now. */
  to: ClientPoint;
  /** How far apart they are now over how far apart they came down: 2 is twice as far. */
  scale: number;
};

export type TwoFingerGestureHandlers<S> = {
  /** Two fingers came down: returns the view the gesture starts from. */
  onStart: () => S;
  /** At most once a frame, the whole gesture so far, and the view it started from. */
  onMove: (gesture: TwoFingerGesture, start: S) => void;
};

/**
 * Two fingers pan and pinch-zoom a plot, leaving one to scroll the page and tap it, as maps on
 * phones do. Each move reports the whole gesture since onStart, so set the view from the start view
 * rather than compounding steps. A second finger landing once the page has started scrolling stays
 * the browser's.
 *
 * Returns the touch-action the element needs, which keeps one-finger page panning and takes pinch.
 * Set it on an outermost svg or an HTML element: browsers ignore touch-action inside an svg. Takes the
 * element, held in state rather than a ref, so one that mounts late, as after loading, still gets its listeners.
 */
export function useTwoFingerGestures<S>(
  element: Element | null,
  handlers: TwoFingerGestureHandlers<S>,
  enabled = true
) {
  const onStart = useStableCallback(handlers.onStart);
  const onMove = useStableCallback(handlers.onMove);

  useEffect(() => {
    // Typed as HTML for its touch events, which an svg has too.
    const target = element as HTMLElement | null;
    if (!target || !enabled) return;

    let fingers: [number, number] | null = null;
    let start: { midpoint: ClientPoint; distance: number; view: S } | null = null;
    let pending: TwoFingerGesture | null = null;
    let frame: number | null = null;

    const find = (touches: TouchList) => {
      if (!fingers) return null;
      const a = Array.from(touches).find((touch) => touch.identifier === fingers![0]);
      const b = Array.from(touches).find((touch) => touch.identifier === fingers![1]);
      return a && b ? ([a, b] as const) : null;
    };
    const measure = ([a, b]: readonly [Touch, Touch]) => ({
      midpoint: { clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 },
      distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
    });
    const flush = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      if (pending && start) onMove(pending, start.view);
      pending = null;
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length < 2) return;
      if (event.cancelable) event.preventDefault();
      if (fingers) return;
      fingers = [event.touches[0].identifier, event.touches[1].identifier];
      start = { ...measure([event.touches[0], event.touches[1]]), view: onStart() };
    };
    const handleTouchMove = (event: TouchEvent) => {
      const pair = find(event.touches);
      if (!pair || !start) return;
      if (event.cancelable) event.preventDefault();
      const { midpoint, distance } = measure(pair);
      pending = { from: start.midpoint, to: midpoint, scale: start.distance > 0 ? distance / start.distance : 1 };
      frame ??= requestAnimationFrame(flush);
    };
    // Either finger lifting ends the gesture; one finger left on the plot does nothing.
    const handleTouchEnd = (event: TouchEvent) => {
      if (!fingers || find(event.touches)) return;
      flush();
      fingers = null;
      start = null;
    };

    target.addEventListener("touchstart", handleTouchStart, { passive: false });
    target.addEventListener("touchmove", handleTouchMove, { passive: false });
    target.addEventListener("touchend", handleTouchEnd);
    target.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      target.removeEventListener("touchstart", handleTouchStart);
      target.removeEventListener("touchmove", handleTouchMove);
      target.removeEventListener("touchend", handleTouchEnd);
      target.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [element, enabled, onStart, onMove]);

  return enabled ? "pan-x pan-y" : undefined;
}

/** A client point in an SVG element's own user space, through its transforms and any viewBox. */
export const toLocal = (element: SVGGraphicsElement, { clientX, clientY }: ClientPoint) => {
  const ctm = element.getScreenCTM();
  if (!ctm) return { x: clientX, y: clientY };
  const point = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  return { x: point.x, y: point.y };
};

type ZoomMatrix = { scaleX: number; scaleY: number; translateX: number; translateY: number };

/**
 * The view that keeps what was under the fingers under them: `start` scaled by `scale` about `from`
 * and carried to `to`, all in the zoom's own coordinates (where a point p shows at scale·p + translate).
 * With `scaleLimits`, a pinch past them stops at the limit and the fingers still pan.
 */
export const followFingers = <M extends ZoomMatrix>(
  start: M,
  from: { x: number; y: number },
  to: { x: number; y: number },
  scale: number,
  scaleLimits?: [min: number, max: number]
): M => {
  const s = scaleLimits
    ? Math.min(Math.max(scale, scaleLimits[0] / start.scaleX), scaleLimits[1] / start.scaleX)
    : scale;
  return {
    ...start,
    scaleX: start.scaleX * s,
    scaleY: start.scaleY * s,
    translateX: to.x + s * (start.translateX - from.x),
    translateY: to.y + s * (start.translateY - from.y),
  };
};
