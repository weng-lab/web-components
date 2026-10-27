import { useEffect, useState } from "react";
import { useStableCallback } from "./useStableCallback";

/**
 * The keys that steer a plot's drags: whether Shift is held, which swaps the plot's drag modes,
 * with `onEscape` called when Escape is pressed, to drop a drag midway. Shift counts as let go
 * when the window loses focus, since its keyup then never arrives.
 */
export function useDragKeys(onEscape: () => void) {
  const [shiftHeld, setShiftHeld] = useState(false);
  const handleKey = useStableCallback((event: KeyboardEvent) => {
    if (event.key === "Shift") setShiftHeld(event.type === "keydown");
    if (event.key === "Escape" && event.type === "keydown") onEscape();
  });

  useEffect(() => {
    const release = () => setShiftHeld(false);
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKey);
      window.removeEventListener("blur", release);
    };
  }, [handleKey]);

  return shiftHeld;
}
