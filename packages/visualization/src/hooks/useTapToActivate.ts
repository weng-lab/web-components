import { useEffect, useMemo, useRef } from "react";

export type TapToActivate<K> = ReturnType<typeof useTapToActivate<K>>;

/**
 * On touch, the first tap on a mark previews it (its hover and tooltip) and a second tap on it acts.
 * Mouse, pen and keyboard clicks act at once. Report the hovered mark with `hover`, and gate clicks
 * with `activates`.
 *
 * Decided by what was hovered at pointerdown, before the tap's own hover, so it holds on iOS Safari,
 * which can drop the click of a tap that showed a hover. Marks compare with ===, so pass the datum or
 * a key built from it.
 */
export function useTapToActivate<K>() {
  const state = useRef<{ hovered: K | null; hoveredAtTap: K | null; touch: boolean }>({
    hovered: null,
    hoveredAtTap: null,
    touch: false,
  });

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      state.current.touch = event.pointerType === "touch";
      state.current.hoveredAtTap = state.current.hovered;
    };
    // A keyboard click (Enter or Space on a focused mark) has no pointerdown of its own.
    const handleKeyDown = () => {
      state.current.touch = false;
    };
    window.addEventListener("pointerdown", handlePointerDown, { capture: true, passive: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);

  return useMemo(
    () => ({
      /** The mark the hover is now on, or null when it leaves the marks. */
      hover: (key: K | null) => {
        state.current.hovered = key;
      },
      /** Whether a click on `key` should act, or only preview it. */
      activates: (key: K) => !state.current.touch || state.current.hoveredAtTap === key,
    }),
    []
  );
}
