import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HeatmapCellId } from "../types";
import type { AnyBin } from "../HeatmapCells";
import type { PlotTooltipHandle } from "../../../tooltip";
import { drawHeatmapCells, getVisibleRange, hitTestCell, buildBin, type CanvasCellParams } from "../HeatmapCanvasCells";

// Extra rows/columns painted/rendered just beyond the visible viewport in scrollable mode, so a
// cell or tick label is already there before it scrolls into view rather than popping in late.
const GRID_OVERSCAN_CELLS = 4;

export interface UseHeatmapCanvasGridArgs {
  canvasCellParams: CanvasCellParams;
  viewportWidth: number;
  viewportHeight: number;
  xTickValues: number[];
  yTickValues: number[];
  isScrollable: boolean;
  onClick?: (bin: AnyBin) => void;
}

export function useHeatmapCanvasGrid({
  canvasCellParams, viewportWidth, viewportHeight, xTickValues, yTickValues, isScrollable, onClick,
}: UseHeatmapCanvasGridArgs) {
  // mainPaneRef is the only pane with a real native scrollbar - the cell canvas and the
  // row/column tick-label panes all track its scroll position by reading it directly here
  // (rAF-throttled), rather than being natively scrolled themselves: the canvas repaints
  // imperatively (drawCanvas), and the tick label panes shift via a transform driven by
  // axisScrollPos state - both cheaper than the pane actually scrolling 15,000px+ of real content.
  const mainPaneRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hoveredCellRef = useRef<HeatmapCellId | null>(null);
  const canvasTooltipRef = useRef<PlotTooltipHandle<AnyBin>>(null);
  const drawRafRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (drawRafRef.current != null) cancelAnimationFrame(drawRafRef.current);
  }, []);

  // Imperative canvas paint - deliberately never routed through React state. Driven both by prop
  // changes (the effect below) and by native scroll events (handleGridScroll), and it's the
  // scroll case that matters: an earlier attempt at this drove the redraw through a React state
  // update on every scroll frame, which forced React to reconcile on every frame and made
  // scrolling *slower* than the plain (if huge) static SVG it replaced. Reading scroll position
  // directly off the DOM and painting immediately keeps scrolling itself entirely on the
  // browser's native, free compositor path - React is never involved.
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const main = mainPaneRef.current;
    if (!canvas || !main) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);
    const range = getVisibleRange(canvasCellParams, main.scrollLeft, main.scrollTop, viewportWidth, viewportHeight, GRID_OVERSCAN_CELLS);
    ctx.translate(-main.scrollLeft, -main.scrollTop);
    drawHeatmapCells(ctx, canvasCellParams, range, hoveredCellRef.current);
  }, [canvasCellParams, viewportWidth, viewportHeight]);

  useEffect(() => {
    if (isScrollable) drawCanvas();
  }, [isScrollable, drawCanvas]);

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
    if (drawRafRef.current != null) return;
    drawRafRef.current = requestAnimationFrame(() => {
      drawRafRef.current = null;
      drawCanvas();
      setAxisScrollPos({ left: main.scrollLeft, top: main.scrollTop });
    });
  }, [drawCanvas]);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const main = mainPaneRef.current;
    if (!main) return;
    const contentX = event.nativeEvent.offsetX + main.scrollLeft;
    const contentY = event.nativeEvent.offsetY + main.scrollTop;
    const cell = hitTestCell(canvasCellParams, contentX, contentY);
    // Matches the SVG path's heatmapCellStyles (`.visx-heatmap-cell { cursor: pointer }`):
    // pointer over any real cell - including a null-count one, which still hit-tests true here,
    // same as it still being a hit target there via `pointer-events: all` - not just where
    // onClick is wired up, so hover-only tooltips still get the affordance.
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
  }, [canvasCellParams, drawCanvas]);

  const handleCanvasMouseLeave = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    event.currentTarget.style.cursor = "default";
    if (hoveredCellRef.current) {
      hoveredCellRef.current = null;
      drawCanvas();
    }
    canvasTooltipRef.current?.hide();
  }, [drawCanvas]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const main = mainPaneRef.current;
    if (!main || !onClick) return;
    const contentX = event.nativeEvent.offsetX + main.scrollLeft;
    const contentY = event.nativeEvent.offsetY + main.scrollTop;
    const cell = hitTestCell(canvasCellParams, contentX, contentY);
    if (!cell) return;
    const bin = buildBin(canvasCellParams, cell);
    if (bin) onClick(bin);
  }, [canvasCellParams, onClick]);

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
