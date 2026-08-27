import { useCallback, useEffect, useRef } from "react";
import { drawHeatmapCells, type CanvasCellParams } from "./HeatmapCanvasCells";

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
  /** Called with a new (unclamped-by-caller) scroll position when the user clicks or drags the minimap. */
  onNavigate: (left: number, top: number) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

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
}: HeatmapMiniMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scaleX = xMax > 0 ? width / xMax : 0;
  const scaleY = yMax > 0 ? height / yMax : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || scaleX <= 0 || scaleY <= 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr * scaleX, 0, 0, dpr * scaleY, 0, 0);
    ctx.clearRect(0, 0, xMax, yMax);
    const range = {
      colStart: 0,
      colEnd: Math.max(0, canvasCellParams.data.length - 1),
      rowStart: 0,
      rowEnd: Math.max(0, canvasCellParams.numRows - 1),
    };
    drawHeatmapCells(ctx, canvasCellParams, range, null);
  }, [canvasCellParams, xMax, yMax, scaleX, scaleY]);

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
      if (scaleX <= 0 || scaleY <= 0) return;
      const rect = event.currentTarget.getBoundingClientRect();
      navigateCentered((event.clientX - rect.left) / scaleX, (event.clientY - rect.top) / scaleY);
    },
    [navigateCentered, scaleX, scaleY]
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
    </div>
  );
};

export default HeatmapMiniMap;
