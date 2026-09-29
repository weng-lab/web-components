import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HeatmapCellId } from "../types";
import type { PlotTooltipHandle } from "../../../tooltip";
import type { AnimationType } from "../../../utility";
import { useStableCallback } from "../../../hooks";
import { drawHeatmapCells, getVisibleRange, hitTestCell, buildBin, type AnyBin, type CanvasCellParams } from "../HeatmapCanvasCells";

// Rows and columns drawn past the viewport, so cells and tick labels don't pop in as they scroll into view.
const GRID_OVERSCAN_CELLS = 4;

export interface UseHeatmapCanvasGridArgs {
  canvasCellParams: CanvasCellParams;
  viewportWidth: number;
  viewportHeight: number;
  xTickValues: number[];
  yTickValues: number[];
  onClick?: (bin: AnyBin) => void;
  animationType?: AnimationType;
}

export function useHeatmapCanvasGrid({
  canvasCellParams, viewportWidth, viewportHeight, xTickValues, yTickValues, onClick, animationType,
}: UseHeatmapCanvasGridArgs) {
  // Only mainPaneRef scrolls natively. The canvas repaints from its scroll position, and the tick
  // label panes follow it through a transform (axisScrollPos), both once per frame.
  const mainPaneRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hoveredCellRef = useRef<HeatmapCellId | null>(null);
  const canvasTooltipRef = useRef<PlotTooltipHandle<AnyBin>>(null);
  const drawRafRef = useRef<number | null>(null);
  // The entry animation in progress, cleared once the cells in view have come to rest.
  const entryRef = useRef<{ type: AnimationType; startedAt: number; scrollLeft: number } | null>(null);

  useEffect(() => () => {
    if (drawRafRef.current != null) cancelAnimationFrame(drawRafRef.current);
  }, []);

  // Painted imperatively rather than through state, so scrolling never waits on a React render.
  // Returns whether cells are still animating in.
  const drawCanvas = useCallback((): boolean => {
    const canvas = canvasRef.current;
    const main = mainPaneRef.current;
    if (!canvas || !main) return false;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);
    const range = getVisibleRange(canvasCellParams, main.scrollLeft, main.scrollTop, viewportWidth, viewportHeight, GRID_OVERSCAN_CELLS);
    ctx.translate(-main.scrollLeft, -main.scrollTop);
    const entry = entryRef.current;
    const isEntering = drawHeatmapCells(
      ctx,
      canvasCellParams,
      range,
      hoveredCellRef.current,
      entry && {
        type: entry.type,
        elapsed: (performance.now() - entry.startedAt) / 1000,
        firstColumn: Math.floor(entry.scrollLeft / canvasCellParams.binWidth),
      }
    );
    if (!isEntering) entryRef.current = null;
    return isEntering;
  }, [canvasCellParams, viewportWidth, viewportHeight]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // So the animation carries on through redraws for other reasons (a highlight sweep, a new
  // selection) rather than starting over.
  const drawLatest = useStableCallback(drawCanvas);

  // Plays on mount and whenever animationType changes.
  useEffect(() => {
    const main = mainPaneRef.current;
    // Nothing to start or cut short.
    if (!main || (!animationType && !entryRef.current)) return;
    entryRef.current = animationType ? { type: animationType, startedAt: performance.now(), scrollLeft: main.scrollLeft } : null;
    let frame = 0;
    const step = () => {
      if (drawLatest()) frame = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(frame);
  }, [animationType, drawLatest]);

  const [axisScrollPos, setAxisScrollPos] = useState({ left: 0, top: 0 });
  const setMainPaneNode = useCallback((node: HTMLDivElement | null) => {
    mainPaneRef.current = node;
    if (node) setAxisScrollPos({ left: node.scrollLeft, top: node.scrollTop });
  }, []);

  const axisVisibleRange = useMemo(
    () => getVisibleRange(canvasCellParams, axisScrollPos.left, axisScrollPos.top, viewportWidth, viewportHeight, GRID_OVERSCAN_CELLS),
    [canvasCellParams, axisScrollPos.left, axisScrollPos.top, viewportWidth, viewportHeight]
  );
  const visibleXTickValues = useMemo(
    () => xTickValues.slice(axisVisibleRange.colStart, axisVisibleRange.colEnd + 1),
    [xTickValues, axisVisibleRange.colStart, axisVisibleRange.colEnd]
  );
  const visibleYTickValues = useMemo(
    () => yTickValues.slice(axisVisibleRange.rowStart, axisVisibleRange.rowEnd + 1),
    [yTickValues, axisVisibleRange.rowStart, axisVisibleRange.rowEnd]
  );

  const handleGridScroll = useCallback(() => {
    const main = mainPaneRef.current;
    if (!main) return;
    // Scrolling ends the animation: cells scrolled to would otherwise sit blank until the sweep reached them.
    entryRef.current = null;
    if (drawRafRef.current != null) return;
    drawRafRef.current = requestAnimationFrame(() => {
      drawRafRef.current = null;
      drawCanvas();
      setAxisScrollPos({ left: main.scrollLeft, top: main.scrollTop });
    });
  }, [drawCanvas]);

  const cellAt = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const main = mainPaneRef.current;
    if (!main) return null;
    return hitTestCell(canvasCellParams, event.nativeEvent.offsetX + main.scrollLeft, event.nativeEvent.offsetY + main.scrollTop);
  }, [canvasCellParams]);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = cellAt(event);
    // A pointer over any cell, null ones included: they have a tooltip too.
    event.currentTarget.style.cursor = cell ? "pointer" : "default";
    const prev = hoveredCellRef.current;
    if (prev?.row !== cell?.row || prev?.column !== cell?.column) {
      hoveredCellRef.current = cell;
      drawCanvas();
    }
    if (cell) {
      const bin = buildBin(canvasCellParams, cell);
      if (bin) canvasTooltipRef.current?.show(bin, event);
    } else {
      canvasTooltipRef.current?.hide();
    }
  }, [canvasCellParams, cellAt, drawCanvas]);

  const handleCanvasMouseLeave = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    event.currentTarget.style.cursor = "default";
    if (hoveredCellRef.current) {
      hoveredCellRef.current = null;
      drawCanvas();
    }
    canvasTooltipRef.current?.hide();
  }, [drawCanvas]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onClick) return;
    const cell = cellAt(event);
    const bin = cell && buildBin(canvasCellParams, cell);
    if (bin) onClick(bin);
  }, [canvasCellParams, cellAt, onClick]);

  return {
    canvasRef, mainPaneRef, canvasTooltipRef, setMainPaneNode, handleGridScroll, axisScrollPos,
    visibleXTickValues, visibleYTickValues,
    canvasHandlers: {
      onMouseMove: handleCanvasMouseMove,
      onMouseLeave: handleCanvasMouseLeave,
      onClick: handleCanvasClick,
    },
  };
}
