type Rect = { left: number; top: number; width: number; height: number };

/** How far a drag has to go along an axis, in pixels, before it marks out a stretch of that axis. */
export const MIN_BOX = 12;

/**
 * Where a box `length` long starts along an axis `size` long, for a drag along it from `from` to
 * `to`: at the drag's start, reaching toward the pointer, and slid back inside the axis where it
 * would pass an end. A box at least as long as the drag still covers all of it.
 */
export const boxStart = (from: number, to: number, length: number, size: number) =>
  Math.min(Math.max(to < from ? from - length : from, 0), size - length);

export type ZoomBoxProps = {
  /** The box, within `area`. */
  box: Rect;
  /** The plot's area, within a positioned container: the box is held to it, and the rest of it is dimmed. */
  area: Rect;
};

/** The box a drag is drawing to zoom into, with the rest of the plot dimmed. It takes no pointer events. */
export const ZoomBox = ({ box, area }: ZoomBoxProps) => (
  <div aria-hidden style={{ position: "absolute", ...area, overflow: "hidden", pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        ...box,
        boxSizing: "border-box",
        border: "1px solid #222",
        boxShadow: `0 0 0 ${area.width + area.height}px rgba(0, 0, 0, 0.25)`,
      }}
    />
  </div>
);
