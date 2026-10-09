import { useEffect, useRef } from "react";
import type { RampRange } from "../colorbarAxis";

/**
 * `onSweep`, remembering whether this element started the sweep showing, so that unmounting
 * mid-sweep (Escape closing the expanded minimap, with no mouseleave) ends it too.
 */
export const useSweep = (onSweep: (sweep: RampRange | null) => void) => {
  const sweeping = useRef(false);
  const latest = useRef(onSweep);
  useEffect(() => {
    latest.current = onSweep;
  });
  useEffect(
    () => () => {
      if (sweeping.current) latest.current(null);
    },
    []
  );
  return (sweep: RampRange | null) => {
    sweeping.current = sweep !== null;
    onSweep(sweep);
  };
};
