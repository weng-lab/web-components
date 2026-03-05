import { localPoint } from "@visx/event";
import { memo } from "react";

type ZoomSurfaceProps = {
  dragStart: (event: React.TouchEvent | React.MouseEvent) => void;
  dragMove: (event: React.TouchEvent | React.MouseEvent) => void;
  dragEnd: () => void;
  scale: (args: { scaleX: number; scaleY: number; point?: { x: number; y: number } }) => void;
  isDragging: boolean;
};


/**
 * rect which catches and handles zoom events
 */

export const ZoomSurface = memo(
  ({ dragStart, dragMove, dragEnd, scale, isDragging }: ZoomSurfaceProps) => {
    return (
      <rect
        width="100%"
        height="100%"
        fill="transparent"
        onTouchStart={dragStart}
        onTouchMove={dragMove}
        onTouchEnd={dragEnd}
        onMouseDown={dragStart}
        onMouseMove={dragMove}
        onMouseUp={dragEnd}
        onMouseLeave={() => {
          if (isDragging) dragEnd();
        }}
        onDoubleClick={(event) => {
          const point = localPoint(event) || { x: 0, y: 0 };
          scale({ scaleX: 1.5, scaleY: 1.5, point });
        }}
      />
    );
  }
);