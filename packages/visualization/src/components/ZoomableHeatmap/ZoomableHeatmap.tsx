import { useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Tooltip, useTheme } from "@mui/material";
import { Add, Remove, SettingsBackupRestore } from "@mui/icons-material";
import { ResponsiveContainer, useResponsiveParentSize } from "../../responsive";
import { PlotTooltip, type PlotTooltipHandle } from "../../tooltip";
import { useStableCallback, useTapToActivate, useTwoFingerGestures, useTwoFingerHint } from "../../hooks";
import { ControlPanel, TwoFingerHint } from "../../controls";
import { downloadAsSVG, downloadSVGAsPNG, isTouchScreen } from "../../utility";
import ColorbarLegend from "../Legend/Colorbar/ColorbarLegend";
import { themeLabelStyle, useEndLabels } from "../Legend/Colorbar/colorbarLabels";
import { LABEL_GAP } from "../Legend/colorbarGeometry";
import { evenStops, sweptValues, type ColorRange, type RampRange } from "../Legend/colorbarAxis";
import { CellRaster, drawHoveredCell, drawSelectedColumns, rampLut } from "./cellRaster";
import { LABEL_FONT_FAMILY, LABEL_FONT_SIZE, axisLabels, fitLabel, widestLabel } from "./axisLabels";
import {
  between, cellAt, centerAxis, fitView, isFit, isFullyZoomed, panAxis, resizeAxis, visibleCells, zoomAxis,
  type AxisSpan, type Spans, type View,
} from "./view";
import { sortedValues } from "./values";
import type { ZoomableHeatmapCell, ZoomableHeatmapProps } from "./types";

const TITLE_FONT_SIZE = 14;
/** Each axis title's strip: the title with 7px either side. */
const TITLE_SPACE = TITLE_FONT_SIZE + 14;
const TICK = 4;
/** Between a tick and its label. */
const TICK_GAP = 3;
/** The most of the plot's width (height) the row (column) labels may take, unless that's under the minimum. */
const LABEL_SHARE = 0.25;
const MIN_LABEL_SPACE = 48;
const PAD = 8;
/** The colorbar's row above the grid: as tall as the range button. */
const LEGEND_ROW = 30;
const LEGEND_GAP = 6;
/** The range button and the gap before it. */
const RANGE_BUTTON = 34;
const MAX_LEGEND_LENGTH = 320;
/** The largest a cell grows: room enough to read and aim at. */
const MAX_CELL = { width: 25, height: 20 };
/** The smallest a cell can be and still be aimed at, by a finger and by a mouse. Smaller, a click zooms in on it. */
const AIM = { touch: 10, mouse: 3 };
const CLICK_ZOOM = 4;
const BUTTON_ZOOM = 2;
const ZOOM_DURATION = 220;
/** How far a mouse moves while pressed before it's dragging rather than clicking. */
const DRAG_THRESHOLD = 4;
/** The most names a group of selected labels lists. */
const GROUP_NAMES = 15;
const SVG_NS = "http://www.w3.org/2000/svg";

const NO_COLUMNS: readonly number[] = [];
const NO_MARKS: ReadonlySet<number> = new Set();
const defaultFormat = (value: number) => String(Number(value.toPrecision(3)));

type Pointer = "touch" | "mouse";
type Box = { left: number; top: number; width: number; height: number };

type Layout = {
  grid: Box;
  yTitle: number;
  xTitle: number;
  rowLabelWidth: number;
  columnLabelHeight: number;
  legend: Box | null;
};

/**
 * Where everything goes. Nothing here depends on the zoom, so zooming never moves the grid: the
 * label strips are sized to the longest labels, up to a share of the plot, once.
 */
function layoutOf(
  width: number,
  height: number,
  { widestRow, widestColumn, xLabel, yLabel, showLegend }: { widestRow: number; widestColumn: number; xLabel?: string; yLabel?: string; showLegend: boolean }
): Layout {
  const yTitle = yLabel ? TITLE_SPACE : 0;
  const xTitle = xLabel ? TITLE_SPACE : 0;
  const rowLabelWidth = Math.ceil(Math.min(widestRow, Math.max(MIN_LABEL_SPACE, width * LABEL_SHARE)));
  const columnLabelHeight = Math.ceil(Math.min(widestColumn, Math.max(MIN_LABEL_SPACE, height * LABEL_SHARE)));
  const left = yTitle + rowLabelWidth + TICK_GAP + TICK;
  const top = showLegend ? PAD / 2 + LEGEND_ROW + LEGEND_GAP : PAD;
  const grid = {
    left,
    top,
    width: Math.max(0, Math.floor(width - left - PAD)),
    height: Math.max(0, Math.floor(height - top - TICK - TICK_GAP - columnLabelHeight - xTitle - PAD / 2)),
  };
  const legend = showLegend ? { left: grid.left, top: PAD / 2, width: grid.width, height: LEGEND_ROW } : null;
  return { grid, yTitle, xTitle, rowLabelWidth, columnLabelHeight, legend };
}

const sameSpan = (a: AxisSpan, b: AxisSpan) => a.cells === b.cells && a.size === b.size && a.maxCell === b.maxCell;

/**
 * The view, refitted when the cells change and kept at the same zoom and middle when the plot is
 * resized. Gestures set it through `set`, which redraws at most once a frame.
 */
function useView(spans: Spans | null) {
  const [state, setState] = useState<{ view: View; spans: Spans } | null>(null);
  let current = state;
  if (spans && (!state || !sameSpan(state.spans.x, spans.x) || !sameSpan(state.spans.y, spans.y))) {
    const recounted = !state || state.spans.x.cells !== spans.x.cells || state.spans.y.cells !== spans.y.cells;
    current = {
      spans,
      view: recounted
        ? fitView(spans)
        : { x: resizeAxis(state.view.x, state.spans.x, spans.x), y: resizeAxis(state.view.y, state.spans.y, spans.y) },
    };
    setState(current);
  }
  const pending = useRef<View | null>(null);
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const show = (view: View) => {
    pending.current = null;
    setState((s) => s && { ...s, view });
  };
  const set = (view: View) => {
    pending.current = view;
    frame.current ||= requestAnimationFrame(() => {
      frame.current = 0;
      if (pending.current) show(pending.current);
    });
  };
  /** The latest view, including one set this frame and not drawn yet. */
  const latest = () => pending.current ?? current?.view ?? null;
  return { view: current?.view ?? null, set, show, latest };
}

/**
 * A heatmap that opens on every cell and zooms in: with a wheel or a pinch over the grid, or over
 * one axis's labels to zoom that axis alone; and, while cells are too small to aim at, with a click
 * or tap on the spot. Built for matrices of around a million cells, drawn from one image of them.
 *
 * The labels thin out to what fits as it zooms out, in strips that never change size, so zooming
 * never shifts the layout. The colorbar above it can be swept to pick out values, and has the
 * button that moves its range beside it.
 */
export const ZoomableHeatmap = ({
  values,
  rowNames,
  columnNames,
  colors,
  colorDomain,
  xLabel,
  yLabel,
  tooltipBody,
  onCellClick,
  selectedColumns = NO_COLUMNS,
  scrollToSelection = false,
  showLegend = true,
  legend,
  fadeIn = false,
  width: manualWidth,
  height: manualHeight,
  ref,
  downloadFileName,
}: ZoomableHeatmapProps) => {
  const theme = useTheme();
  const { parentRef, containerStyle, width, height } = useResponsiveParentSize({ width: manualWidth, height: manualHeight });
  const rows = rowNames.length;
  const columns = columnNames.length;
  const ready = width > 0 && height > 0 && rows > 0 && columns > 0 && typeof window !== "undefined";
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;

  // Colors
  const sorted = useMemo(() => sortedValues(values), [values]);
  const defaultRange: ColorRange = colorDomain ?? (sorted.length ? [sorted[0], sorted[sorted.length - 1]] : [0, 1]);
  const defaultKey = `${defaultRange[0]}|${defaultRange[1]}`;
  // Moved ranges, by the default each was moved from.
  const [moved, setMoved] = useState<ReadonlyMap<string, ColorRange>>(new Map());
  const range = moved.get(defaultKey) ?? defaultRange;
  const colorsKey = colors.join("\u0000");
  const stops = useMemo(() => evenStops(colorsKey.split("\u0000")), [colorsKey]);
  const lut = useMemo(() => rampLut(stops), [stops]);
  const [sweep, setSweep] = useState<RampRange | null>(null);
  const highlight = sweep && sweptValues(range, sweep);
  const format = legend?.format ?? defaultFormat;
  const labelStyle = legend?.labelStyle ?? themeLabelStyle(theme);
  const editable = legend?.editable ?? true;
  const endLabels = useEndLabels(range, sorted, format, labelStyle, false);

  // Layout
  const widestRow = useMemo(() => (ready ? widestLabel(rowNames) : 0), [ready, rowNames]);
  const widestColumn = useMemo(() => (ready ? widestLabel(columnNames) : 0), [ready, columnNames]);
  const layout = ready ? layoutOf(width, height, { widestRow, widestColumn, xLabel, yLabel, showLegend }) : null;
  const gridWidth = layout?.grid.width ?? 0;
  const gridHeight = layout?.grid.height ?? 0;
  const spans = useMemo<Spans | null>(
    () =>
      gridWidth > 0 && gridHeight > 0
        ? { x: { cells: columns, size: gridWidth, maxCell: MAX_CELL.width }, y: { cells: rows, size: gridHeight, maxCell: MAX_CELL.height } }
        : null,
    [columns, rows, gridWidth, gridHeight]
  );
  const { view, set: setView, show: showView, latest } = useView(spans);

  // Interaction
  const plotRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const rowStripRef = useRef<HTMLDivElement | null>(null);
  const columnStripRef = useRef<HTMLDivElement | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chromeRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<PlotTooltipHandle<ZoomableHeatmapCell>>(null);
  const tap = useTapToActivate<number>();
  const pointer = useRef<Pointer>(isTouchScreen() ? "touch" : "mouse");
  const drag = useRef<{ x: number; y: number; view: View; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const draggedRef = useRef(false);
  const [hovered, setHovered] = useState<{ row: number; column: number } | null>(null);
  const animation = useRef(0);
  useEffect(() => () => cancelAnimationFrame(animation.current), []);

  const aimable = (v: View | null, by: Pointer) => !!v && Math.min(v.x.scale, v.y.scale) >= AIM[by];

  const stopAnimation = () => {
    cancelAnimationFrame(animation.current);
    animation.current = 0;
  };
  const animateTo = (target: View) => {
    stopAnimation();
    const from = latest();
    if (!from) return;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ZOOM_DURATION);
      showView(between(from, target, 1 - (1 - t) ** 3));
      animation.current = t < 1 ? requestAnimationFrame(step) : 0;
    };
    animation.current = requestAnimationFrame(step);
  };
  const zoomBy = (factor: number, at?: { x: number; y: number }) => {
    const v = latest();
    if (!v || !spans) return;
    const x = at?.x ?? spans.x.size / 2;
    const y = at?.y ?? spans.y.size / 2;
    animateTo({ x: zoomAxis(v.x, spans.x, factor, x), y: zoomAxis(v.y, spans.y, factor, y) });
  };

  const leave = () => {
    setHovered(null);
    tap.hover(null);
    tooltipRef.current?.hide();
  };
  const localPoint = (event: { clientX: number; clientY: number }) => {
    const rect = surfaceRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const cellUnder = (v: View, point: { x: number; y: number }): ZoomableHeatmapCell | null => {
    const column = cellAt(v.x, columns, point.x);
    const row = cellAt(v.y, rows, point.y);
    return column < 0 || row < 0 ? null : { row, column, value: values[column * rows + row] };
  };

  const hoverAt = (event: MouseEvent) => {
    const v = latest();
    const cell = v && aimable(v, pointer.current) ? cellUnder(v, localPoint(event)) : null;
    if (!cell) return leave();
    if (hovered?.row !== cell.row || hovered?.column !== cell.column) setHovered({ row: cell.row, column: cell.column });
    tap.hover(cell.column * rows + cell.row);
    tooltipRef.current?.show(cell, event);
  };

  const handleClick = (event: MouseEvent) => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    const v = latest();
    if (!v) return;
    const point = localPoint(event);
    if (!aimable(v, pointer.current)) {
      leave();
      zoomBy(CLICK_ZOOM, point);
      return;
    }
    const cell = cellUnder(v, point);
    if (cell && tap.activates(cell.column * rows + cell.row)) onCellClick?.(cell);
  };

  // The wheel zooms, over the grid both ways and over an axis's labels that axis alone. Not
  // passive, as React's onWheel is, so it can keep the page from scrolling.
  const handleWheel = useStableCallback((event: WheelEvent, axes: "both" | "x" | "y") => {
    event.preventDefault();
    const v = latest();
    if (!v || !spans) return;
    stopAnimation();
    leave();
    const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1);
    // A trackpad pinch arrives as a ctrl+wheel of small steps.
    const factor = Math.exp(-pixels * (event.ctrlKey ? 0.01 : 0.002));
    const { x, y } = localPoint(event);
    setView({
      x: axes === "y" ? v.x : zoomAxis(v.x, spans.x, factor, x),
      y: axes === "x" ? v.y : zoomAxis(v.y, spans.y, factor, y),
    });
  });
  useEffect(() => {
    const listen = (element: HTMLElement | null, axes: "both" | "x" | "y") => {
      const handle = (event: WheelEvent) => handleWheel(event, axes);
      element?.addEventListener("wheel", handle, { passive: false });
      return () => element?.removeEventListener("wheel", handle);
    };
    const stops = [listen(surfaceRef.current, "both"), listen(rowStripRef.current, "y"), listen(columnStripRef.current, "x")];
    return () => stops.forEach((stop) => stop());
  }, [handleWheel, ready]);

  // Two fingers pan and pinch, as the wheel zooms: the grid both ways, an axis's labels that axis alone.
  const pinch = (axes: "both" | "x" | "y") => ({
    onStart: () => {
      stopAnimation();
      leave();
      return { view: latest(), rect: surfaceRef.current!.getBoundingClientRect() };
    },
    onMove: (
      { from, to, scale }: { from: { clientX: number; clientY: number }; to: { clientX: number; clientY: number }; scale: number },
      { view: v, rect }: { view: View | null; rect: DOMRect }
    ) => {
      if (!v || !spans) return;
      setView({
        x: axes === "y" ? v.x : zoomAxis(v.x, spans.x, scale, from.clientX - rect.left, to.clientX - rect.left),
        y: axes === "x" ? v.y : zoomAxis(v.y, spans.y, scale, from.clientY - rect.top, to.clientY - rect.top),
      });
    },
  });
  const surfaceTouchAction = useTwoFingerGestures(surfaceRef, pinch("both"), ready);
  const rowTouchAction = useTwoFingerGestures(rowStripRef, pinch("y"), ready);
  const columnTouchAction = useTwoFingerGestures(columnStripRef, pinch("x"), ready);
  const hint = useTwoFingerHint(surfaceRef, ready);

  // Selection
  const selected = useMemo(() => new Set(selectedColumns), [selectedColumns]);
  const previousSelection = useRef(selected);
  useEffect(() => {
    const previous = previousSelection.current;
    previousSelection.current = selected;
    const v = latest();
    if (!scrollToSelection || !v || !spans) return;
    const added = selectedColumns.filter((column) => !previous.has(column));
    if (!added.length) return;
    const column = added[added.length - 1];
    const left = v.x.translate + column * v.x.scale;
    if (left >= 0 && left + v.x.scale <= spans.x.size) return;
    animateTo({ ...v, x: centerAxis(v.x, spans.x, column + 0.5) });
    // Only on a change of selection: the view moving isn't one.
  }, [selected]);

  // Drawing
  const raster = useMemo(() => (ready ? new CellRaster(values, rows, columns) : null), [ready, values, rows, columns]);
  const colorKey = `${range[0]}|${range[1]}|${highlight?.[0]}|${highlight?.[1]}`;
  const recolored = useRef<{ raster: CellRaster; lut: Uint8ClampedArray; key: string } | null>(null);
  const paint = (ctx: CanvasRenderingContext2D, v: View, scale: number, hover: { row: number; column: number } | null) => {
    if (!raster || !layout) return;
    const last = recolored.current;
    if (last?.raster !== raster || last.lut !== lut || last.key !== colorKey) {
      raster.recolor({ lut, domain: range, highlight });
      recolored.current = { raster, lut, key: colorKey };
    }
    const { width: w, height: h } = layout.grid;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, w, h);
    raster.draw(ctx, v, w, h, scale);
    drawSelectedColumns(ctx, v, selected, w, h);
    if (hover) drawHoveredCell(ctx, v, hover.row, hover.column);
  };
  const [painted, setPainted] = useState(false);
  useLayoutEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !view) return;
    paint(ctx, view, dpr, hovered);
    if (!painted) setPainted(true);
  });

  // Downloads, of the view as it is: the cells as an image, under the labels and the colorbar.
  const withExportSvg = (use: (svg: SVGSVGElement, done: () => void) => void) => {
    const chrome = chromeRef.current;
    const plot = plotRef.current;
    const v = latest();
    if (!chrome || !plot || !v || !layout) return false;
    const svg = chrome.cloneNode(true) as SVGSVGElement;
    svg.setAttribute("xmlns", SVG_NS);
    svg.removeAttribute("style");
    const cells = document.createElement("canvas");
    const scale = 2;
    cells.width = layout.grid.width * scale;
    cells.height = layout.grid.height * scale;
    const ctx = cells.getContext("2d");
    if (!ctx) return false;
    paint(ctx, v, scale, null);
    const image = document.createElementNS(SVG_NS, "image");
    image.setAttribute("href", cells.toDataURL("image/png"));
    image.setAttribute("x", String(layout.grid.left));
    image.setAttribute("y", String(layout.grid.top));
    image.setAttribute("width", String(layout.grid.width));
    image.setAttribute("height", String(layout.grid.height));
    svg.insertBefore(image, svg.firstChild);
    const colorbar = legendRef.current?.querySelector("svg");
    if (colorbar) {
      const at = colorbar.getBoundingClientRect();
      const origin = plot.getBoundingClientRect();
      const copy = colorbar.cloneNode(true) as SVGSVGElement;
      copy.removeAttribute("style");
      copy.setAttribute("x", String(at.left - origin.left));
      copy.setAttribute("y", String(at.top - origin.top));
      svg.appendChild(copy);
    }
    // Attached while it's used: the PNG export reads its laid-out size.
    const holder = document.createElement("div");
    holder.style.cssText = "position:fixed;left:-100000px;top:0;";
    holder.appendChild(svg);
    document.body.appendChild(holder);
    use(svg, () => holder.remove());
    return true;
  };
  useImperativeHandle(ref, () => ({
    downloadSVG: () => {
      withExportSvg((svg, done) => {
        downloadAsSVG(svg, downloadFileName ?? "heatmap.svg");
        done();
      });
    },
    downloadPNG: () =>
      new Promise<void>((resolve) => {
        const started = withExportSvg((svg, done) =>
          downloadSVGAsPNG(svg, downloadFileName ?? "heatmap.png", undefined, () => {
            done();
            resolve();
          })
        );
        if (!started) resolve();
      }),
  }));

  const body = (cell: ZoomableHeatmapCell) =>
    tooltipBody ? (
      tooltipBody(cell, range)
    ) : (
      <div>
        <div><strong>{columnNames[cell.column]}</strong></div>
        <div>{rowNames[cell.row]}</div>
        <div>{Number.isNaN(cell.value) ? "No value" : format(cell.value)}</div>
      </div>
    );

  const content = (() => {
    if (!layout || !view || !spans) return null;
    const { grid, yTitle, xTitle, rowLabelWidth, columnLabelHeight } = layout;
    const [firstRow, endRow] = visibleCells(view.y, spans.y);
    const [firstColumn, endColumn] = visibleCells(view.x, spans.x);
    const rowCenter = (row: number) => view.y.translate + (row + 0.5) * view.y.scale;
    const columnCenter = (column: number) => view.x.translate + (column + 0.5) * view.x.scale;
    const rowLabels = axisLabels(firstRow, endRow, view.y.scale, NO_MARKS).cells.filter((row) => {
      const center = rowCenter(row);
      return center >= 0 && center <= grid.height;
    });
    const columnLabels = axisLabels(firstColumn, endColumn, view.x.scale, selected);
    const inGrid = (column: number) => {
      const center = columnCenter(column);
      return center >= 0 && center <= grid.width;
    };
    const gridBottom = grid.top + grid.height;
    const canZoomOut = !(isFit(view.x, spans.x) && isFit(view.y, spans.y));
    const canZoomIn = !(isFullyZoomed(view.x, spans.x) && isFullyZoomed(view.y, spans.y));
    const barLength = Math.max(
      60,
      Math.min(MAX_LEGEND_LENGTH, grid.width - endLabels.low.width - endLabels.high.width - 2 * LABEL_GAP - (editable ? RANGE_BUTTON : 0))
    );

    const columnLabel = (column: number, text: string, bold: boolean) => (
      <text
        transform={`translate(${grid.left + columnCenter(column)},${gridBottom + TICK + TICK_GAP}) rotate(-90)`}
        textAnchor="end"
        dominantBaseline="middle"
        fontWeight={bold ? 700 : undefined}
      >
        {text}
      </text>
    );
    const tick = (column: number) => {
      const x = grid.left + columnCenter(column);
      return <line x1={x} x2={x} y1={gridBottom} y2={gridBottom + TICK} stroke="#222" />;
    };

    return (
      <div ref={plotRef} style={{ position: "relative", width, height }}>
        <canvas
          ref={canvasRef}
          width={Math.round(grid.width * dpr)}
          height={Math.round(grid.height * dpr)}
          style={{
            position: "absolute",
            left: grid.left,
            top: grid.top,
            width: grid.width,
            height: grid.height,
            opacity: fadeIn && !painted ? 0 : 1,
            transition: fadeIn ? "opacity 300ms ease-out" : undefined,
          }}
        />
        <div
          ref={rowStripRef}
          style={{ position: "absolute", left: yTitle, top: grid.top, width: grid.left - yTitle, height: grid.height, touchAction: rowTouchAction }}
        />
        <div
          ref={columnStripRef}
          style={{ position: "absolute", left: grid.left, top: gridBottom, width: grid.width, height: TICK + TICK_GAP + columnLabelHeight, touchAction: columnTouchAction }}
        />
        {/* Over the label strips, which take the wheel and pinches: only a group's label takes the pointer, to list its names. */}
        <svg
          ref={chromeRef}
          width={width}
          height={height}
          fontFamily={LABEL_FONT_FAMILY}
          fontSize={LABEL_FONT_SIZE}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}
        >
          {yLabel && (
            <text
              x={yTitle / 2}
              y={grid.top + grid.height / 2}
              transform={`rotate(-90, ${yTitle / 2}, ${grid.top + grid.height / 2})`}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={TITLE_FONT_SIZE}
            >
              {yLabel}
            </text>
          )}
          {rowLabels.map((row) => {
            const y = grid.top + rowCenter(row);
            return (
              <g key={row}>
                <line x1={grid.left - TICK} x2={grid.left} y1={y} y2={y} stroke="#222" />
                <text x={grid.left - TICK - TICK_GAP} y={y} textAnchor="end" dominantBaseline="middle">
                  {fitLabel(rowNames[row], rowLabelWidth)}
                </text>
              </g>
            );
          })}
          {columnLabels.cells.filter(inGrid).map((column) => (
            <g key={column}>
              {tick(column)}
              {columnLabel(column, fitLabel(columnNames[column], columnLabelHeight), false)}
            </g>
          ))}
          {columnLabels.groups
            .filter(({ at }) => inGrid(at))
            .map(({ at, members }) =>
              members.length === 1 ? (
                <g key={members[0]}>
                  {tick(at)}
                  {columnLabel(at, fitLabel(columnNames[members[0]], columnLabelHeight), true)}
                </g>
              ) : (
                <Tooltip
                  key={members[0]}
                  enterTouchDelay={0}
                  leaveTouchDelay={4000}
                  title={
                    <>
                      {members.slice(0, GROUP_NAMES).map((column) => (
                        <div key={column}>{columnNames[column]}</div>
                      ))}
                      {members.length > GROUP_NAMES && <div>and {members.length - GROUP_NAMES} more</div>}
                    </>
                  }
                >
                  <g style={{ pointerEvents: "auto", cursor: "default" }}>
                    {tick(at)}
                    {columnLabel(at, `${members.length} selected`, true)}
                  </g>
                </Tooltip>
              )
            )}
          {xLabel && (
            <text
              x={grid.left + grid.width / 2}
              y={gridBottom + TICK + TICK_GAP + columnLabelHeight + xTitle / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={TITLE_FONT_SIZE}
            >
              {xLabel}
            </text>
          )}
        </svg>
        <div
          ref={surfaceRef}
          style={{
            position: "absolute",
            ...grid,
            touchAction: surfaceTouchAction,
            cursor: dragging ? "grabbing" : !aimable(view, "mouse") ? "zoom-in" : onCellClick ? "pointer" : "default",
          }}
          onPointerDown={(event) => {
            pointer.current = event.pointerType === "touch" ? "touch" : "mouse";
            draggedRef.current = false;
            if (event.pointerType === "touch" || event.button !== 0) return;
            stopAnimation();
            drag.current = { x: event.clientX, y: event.clientY, view: latest()!, moved: false };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const d = drag.current;
            if (!d) return;
            const dx = event.clientX - d.x;
            const dy = event.clientY - d.y;
            if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
            if (!d.moved) {
              d.moved = true;
              setDragging(true);
              leave();
            }
            setView({ x: panAxis(d.view.x, spans.x, dx), y: panAxis(d.view.y, spans.y, dy) });
          }}
          onPointerUp={() => {
            draggedRef.current = !!drag.current?.moved;
            drag.current = null;
            setDragging(false);
          }}
          onPointerCancel={() => {
            drag.current = null;
            setDragging(false);
          }}
          onMouseMove={(event) => {
            if (!drag.current?.moved) hoverAt(event);
          }}
          onMouseLeave={leave}
          onClick={handleClick}
        />
        {layout.legend && (
          <div
            ref={legendRef}
            style={{ position: "absolute", ...layout.legend, display: "flex", alignItems: "center", justifyContent: "flex-end" }}
          >
            <ColorbarLegend
              label={legend?.label ?? "Values"}
              stops={stops}
              range={range}
              kind={legend?.kind}
              values={sorted}
              format={format}
              formatValue={legend?.formatValue}
              noun={legend?.noun ?? "cell"}
              sweep={sweep}
              onSweep={setSweep}
              marker={hovered ? values[hovered.column * rows + hovered.row] : null}
              length={barLength}
              labelStyle={labelStyle}
              notes={legend?.notes}
              control={
                editable
                  ? {
                      defaultRange,
                      extent: legend?.extent,
                      presets: legend?.presets,
                      onChange: (next) => setMoved((current) => new Map(current).set(defaultKey, next)),
                    }
                  : undefined
              }
            />
          </div>
        )}
        {isTouchScreen() && !aimable(view, "touch") && (
          <div
            style={{
              position: "absolute",
              left: grid.left + 6,
              top: grid.top + 6,
              padding: "2px 6px",
              borderRadius: 4,
              background: "rgba(255, 255, 255, 0.8)",
              font: `${LABEL_FONT_SIZE}px ${LABEL_FONT_FAMILY}`,
              color: "#333",
              pointerEvents: "none",
            }}
          >
            Tap to zoom in
          </div>
        )}
        <TwoFingerHint shown={hint} style={grid} />
        <ControlPanel
          style={{ position: "absolute", left: grid.left + grid.width - 6, top: grid.top + 6, transform: "translateX(-100%)" }}
          tooltipPlacement="left"
          buttons={[
            { label: "Zoom in", icon: <Add fontSize="small" />, onClick: () => zoomBy(BUTTON_ZOOM), disabled: !canZoomIn },
            { label: "Zoom out", icon: <Remove fontSize="small" />, onClick: () => zoomBy(1 / BUTTON_ZOOM), disabled: !canZoomOut },
            {
              label: "Reset zoom",
              tooltip: "Show everything",
              icon: <SettingsBackupRestore fontSize="small" />,
              onClick: () => animateTo(fitView(spans)),
              disabled: !canZoomOut,
            },
          ]}
        />
      </div>
    );
  })();

  return (
    <ResponsiveContainer parentRef={parentRef} containerStyle={containerStyle}>
      {content}
      <PlotTooltip ref={tooltipRef} zIndex={theme.zIndex.tooltip}>
        {body}
      </PlotTooltip>
    </ResponsiveContainer>
  );
};

export default ZoomableHeatmap;
