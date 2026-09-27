import { useCallback, useEffect, useRef } from "react";
import { drawHeatmapOverview, type CanvasCellParams } from "../HeatmapCanvasCells";
import { SELECTION_COLOR } from "../heatmapSelection";

export interface HeatmapMiniMapProps {
  canvasCellParams: CanvasCellParams;
  xMax: number;
  yMax: number;
  viewportWidth: number;
  viewportHeight: number;
  scrollLeft: number;
  scrollTop: number;
  width: number;
  height: number;
  onNavigate: (left: number, top: number) => void;
  onCanvasClick?: () => void;
  /** Fires after each draw completes, so a caller (e.g. the expanded popup) can show its own
   * loading state for the full-dataset draw without this component needing to know about it. */
  onReady?: () => void;
  /**
   * Keeps the last drawing instead of redrawing, while this copy is out of sight - the inline
   * minimap, under the expanded one. A sweep of the expanded minimap's legend would otherwise draw
   * the whole grid twice per step. Redraws as soon as it is lifted.
   */
  paused?: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** How far a selection mark reaches in from the minimap's edge, and how narrow one can get. */
const MARK_DEPTH = 5;
const MARK_MIN_WIDTH = 2;

const HeatmapMiniMap = ({
  canvasCellParams,
  xMax,
  yMax,
  viewportWidth,
  viewportHeight,
  scrollLeft,
  scrollTop,
  width,
  height,
  onNavigate,
  onCanvasClick,
  onReady,
  paused = false,
}: HeatmapMiniMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scaleX = xMax > 0 ? width / xMax : 0;
  const scaleY = yMax > 0 ? height / yMax : 0;

  // Read via a ref rather than as an effect dependency below - onReady is commonly passed as an
  // inline arrow function, and putting it in the deps array would re-trigger (and re-run) the
  // draw effect on every parent render instead of only when the drawable content actually changes.
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || paused || scaleX <= 0 || scaleY <= 0) return;
    // The full-dataset draw below is synchronous and can take a while for large grids (the
    // minimap has no windowing, unlike the main grid). Deferring it a frame lets the surrounding
    // UI - the expanded popup's backdrop, border, and title bar - paint first, so opening the
    // minimap feels immediate instead of the whole popup appearing to hang.
    const raf = requestAnimationFrame(() => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawHeatmapOverview(ctx, canvasCellParams);
      onReadyRef.current?.();
    });
    return () => cancelAnimationFrame(raf);
  }, [canvasCellParams, xMax, yMax, scaleX, scaleY, paused]);

  const navigateCentered = useCallback(
    (contentX: number, contentY: number) => {
      onNavigate(
        clamp(contentX - viewportWidth / 2, 0, Math.max(0, xMax - viewportWidth)),
        clamp(contentY - viewportHeight / 2, 0, Math.max(0, yMax - viewportHeight))
      );
    },
    [onNavigate, viewportWidth, viewportHeight, xMax, yMax]
  );

  const handleCanvasPointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (onCanvasClick) {
        onCanvasClick();
        return;
      }
      if (scaleX <= 0 || scaleY <= 0) return;
      const rect = event.currentTarget.getBoundingClientRect();
      navigateCentered((event.clientX - rect.left) / scaleX, (event.clientY - rect.top) / scaleY);
    },
    [onCanvasClick, navigateCentered, scaleX, scaleY]
  );

  const handleRectPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handleRectPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (scaleX <= 0 || scaleY <= 0 || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
      onNavigate(
        clamp(scrollLeft + event.movementX / scaleX, 0, Math.max(0, xMax - viewportWidth)),
        clamp(scrollTop + event.movementY / scaleY, 0, Math.max(0, yMax - viewportHeight))
      );
    },
    [scrollLeft, scrollTop, scaleX, scaleY, xMax, yMax, viewportWidth, viewportHeight, onNavigate]
  );

  const handleRectPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const { columns, rows } = canvasCellParams.selectionMarks;
  const numColumns = canvasCellParams.data.length;
  const { numRows } = canvasCellParams;
  // Cell i's run along an edge `size` pixels long holding `cells` of them, widened to be seen.
  const markSpan = (i: number, cells: number, size: number) => {
    const from = (i * size) / cells;
    const run = size / cells;
    const extra = Math.max(0, MARK_MIN_WIDTH - run) / 2;
    return [from - extra, run + 2 * extra] as const;
  };

  const rectLeft = clamp(scrollLeft * scaleX, 0, width);
  const rectTop = clamp(scrollTop * scaleY, 0, height);
  const rectWidth = Math.max(0, Math.min(viewportWidth * scaleX, width - rectLeft));
  const rectHeight = Math.max(0, Math.min(viewportHeight * scaleY, height - rectTop));

  return (
    <div style={{ position: "relative", width, height }}>
      <canvas
        ref={canvasRef}
        width={width * (window.devicePixelRatio || 1)}
        height={height * (window.devicePixelRatio || 1)}
        style={{ width, height, display: "block", cursor: "pointer", border: "1px solid #d5d5d5", boxSizing: "border-box" }}
        onPointerDown={handleCanvasPointerDown}
      />
      <div
        onPointerDown={handleRectPointerDown}
        onPointerMove={handleRectPointerMove}
        onPointerUp={handleRectPointerUp}
        style={{
          position: "absolute",
          left: rectLeft,
          top: rectTop,
          width: rectWidth,
          height: rectHeight,
          border: "2px solid #0d0f98",
          backgroundColor: "rgba(13, 15, 152, 0.15)",
          cursor: "grab",
          boxSizing: "border-box",
        }}
      />
      {/*
        The columns and rows holding the selection, marked along the top and left edges: a column
        here is often under a pixel wide, too narrow to frame, and these are what find a selection in
        a grid too large to scroll through. Above the viewport rectangle, whose border would otherwise
        cover them just when the selection is in view.
      */}
      {(columns.size > 0 || rows.size > 0) && (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          aria-hidden
        >
          <g fill={SELECTION_COLOR}>
            {[...columns].map((column) => {
              const [x, w] = markSpan(column, numColumns, width);
              return <rect key={`c${column}`} x={x} y={0} width={w} height={MARK_DEPTH} />;
            })}
            {/* Row 0 is at the bottom. */}
            {[...rows].map((row) => {
              const [y, h] = markSpan(numRows - 1 - row, numRows, height);
              return <rect key={`r${row}`} x={0} y={y} width={MARK_DEPTH} height={h} />;
            })}
          </g>
        </svg>
      )}
    </div>
  );
};

export default HeatmapMiniMap;
