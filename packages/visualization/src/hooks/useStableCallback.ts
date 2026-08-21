import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * Wraps a callback in a stable identity that always forwards to the most recent version.
 *
 * Plots pass consumer callbacks (onClick and friends) down to memoized marks. Consumers of this
 * package will not necessarily have the React Compiler enabled, so those props commonly arrive
 * as a fresh inline arrow on every render - handing one straight to thousands of memoized marks
 * invalidates all of them. Wrapping it here gives the marks a prop that never changes identity
 * while still calling the latest callback.
 *
 * The returned callback must only be invoked from event handlers or effects, never during
 * render: the ref is updated after commit, so during render it still holds the previous value.
 */
export function useStableCallback<Args extends unknown[], R>(
  callback: ((...args: Args) => R) | undefined
): (...args: Args) => R | undefined {
  const callbackRef = useRef(callback);

  // Layout effect rather than assigning during render, which is unsafe under concurrent
  // rendering (a render can be thrown away). This runs before the browser can dispatch the
  // next event, so the ref is always current by the time the returned callback can fire.
  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args: Args) => callbackRef.current?.(...args), []);
}
