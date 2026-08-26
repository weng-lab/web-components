import { scaleLinear } from "@visx/scale";
import type { HeatmapProps, ColumnDatum, HeatmapCellId } from "./types";
import { useImperativeHandle, useRef, useMemo, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { downloadAsSVG, downloadSVGAsPNG, measureTextWidth } from "../../utility";
import { ResponsiveContainer, useResponsiveParentSize } from "../../responsive";
import { AxisLeft, AxisBottom } from "@visx/axis";
import HeatmapCells, { type AnyBin } from "./HeatmapCells";
import { heatmapCellStyles } from "./HeatmapCell";
import HeatmapLegend, { getHeatmapLegendWidth } from "./HeatmapLegend";
import { DEFAULT_DESELECTED_COLOR, cellKey, getHeatmapColorScales } from "./heatmapCellAppearance";
import { drawHeatmapCells, getVisibleRange, hitTestCell, buildBin, type CanvasCellParams } from "./HeatmapCanvasCells";
import { PlotTooltip, type PlotTooltipHandle } from "../../tooltip";

const SVG_NS = "http://www.w3.org/2000/svg";
const LEGEND_GAP = 16;
// Extra breathing room between the tick labels and the axis title, beyond the space
// reserved for the tick labels themselves.
const AXIS_LABEL_GAP = 12;
// Space reserved for the axis title itself (the "X-Axis Label" / "Y-Axis Label" text), beyond
// the tick labels. In scrollable mode this is carved out into its own always-visible pane so
// the title can't be scrolled out of view - see yTitleWidth/xTitleHeight below.
const Y_AXIS_TITLE_SPACE = 40;
const X_AXIS_TITLE_SPACE = 70;
const TICK_FONT_SIZE = 12;
const TICK_FONT_FAMILY = "sans-serif";
// Canvas's measureText and the browser's actual SVG text layout don't agree to the sub-pixel,
// and the gap widens with string length - pad generously so long tick labels aren't clipped.
const TICK_LABEL_WIDTH_SAFETY_FACTOR = 1.15;
// Extra rows/columns painted/rendered just beyond the visible viewport in scrollable mode, so a
// cell or tick label is already there before it scrolls into view rather than popping in late.
const GRID_OVERSCAN_CELLS = 4;
const getBins = (d: ColumnDatum) => d.rows;

function maxOf<Datum>(data: Datum[], value: (d: Datum) => number | null): number {
  // Null counts are gaps in the data and don't participate in the max. reduce rather than
  // Math.max(...spread): returns 0 (not -Infinity) for empty/all-null input, with no
  // argument-count ceiling.
  return data.reduce((max, datum) => {
    const datumValue = value(datum);
    return datumValue == null ? max : Math.max(max, datumValue);
  }, 0);
}

const Heatmap = ({
  data,
  onClick,
  ref,
  downloadFileName,
  colors,
  xLabel,
  yLabel,
  tooltipBody,
  margin,
  gap = 2,
  isRect = true,
  animationType,
  showLegend = true,
  width,
  height,
  xLabelOrientation = "vertical",
  selectedCells,
  deselectedColor,
  cellWidth,
  cellHeight,
}: HeatmapProps) => {
  const { parentRef, containerStyle, width: parentWidth, height: parentHeight } = useResponsiveParentSize({ width, height });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const isScrollable = cellWidth != null && cellHeight != null;

  // Frozen-pane refs: only used when isScrollable. mainPaneRef is the only pane with a real
  // native scrollbar - the cell canvas and the row/column tick-label panes all track its scroll
  // position by reading it directly in handleGridScroll (rAF-throttled), rather than being
  // natively scrolled themselves: the canvas repaints imperatively (drawCanvas), and the tick
  // label SVGs are viewport-sized and shift via a transform driven by axisScrollPos state (see
  // below) - both cheaper than the pane actually scrolling 15,000px+ of real content.
  const mainPaneRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const legendSvgRef = useRef<SVGSVGElement | null>(null);
  const hoveredCellRef = useRef<HeatmapCellId | null>(null);
  const canvasTooltipRef = useRef<PlotTooltipHandle<AnyBin>>(null);
  const drawRafRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (drawRafRef.current != null) cancelAnimationFrame(drawRafRef.current);
  }, []);

  const allColNames = useMemo(() => data.map((d) => d.columnName), [data]);
  const allRowNames = useMemo(() => data[0]?.rows.map((r) => r.rowName) ?? [], [data]);
  const maxValue = useMemo(() => maxOf(data, (d) => maxOf(getBins(d), (r) => r.count)), [data]);
  const numRows = useMemo(() => maxOf(data, (d) => getBins(d).length), [data]);

  // Measured (not estimated) pixel width of the longest label, so any label - short or long,
  // narrow or wide characters - gets exactly the room it needs rather than a per-character guess.
  const maxColNameWidth = useMemo(
    () => allColNames.reduce((m, name) => Math.max(m, measureTextWidth(name, TICK_FONT_SIZE, TICK_FONT_FAMILY)), 0) * TICK_LABEL_WIDTH_SAFETY_FACTOR,
    [allColNames]
  );
  const maxRowNameWidth = useMemo(
    () => allRowNames.reduce((m, name) => Math.max(m, measureTextWidth(name, TICK_FONT_SIZE, TICK_FONT_FAMILY)), 0) * TICK_LABEL_WIDTH_SAFETY_FACTOR,
    [allRowNames]
  );

  const xTickAngle = xLabelOrientation === "horizontal" ? 0 : xLabelOrientation === "vertical" ? -90 : xLabelOrientation === "leftDiagonal" ? -45 : 45;
  const xTickTextAnchor: "middle" | "start" | "end" = xLabelOrientation === "horizontal" ? "middle" : xLabelOrientation === "rightDiagonal" ? "start" : "end";
  const rotatedColNameSpace = maxColNameWidth;
  const colLabelHeight = xLabelOrientation === "horizontal" ? 12 : xLabelOrientation === "vertical" ? rotatedColNameSpace : rotatedColNameSpace * Math.SQRT1_2;

  const colorsKey = colors.join("\u0000");
  const stableColors = useMemo(
    () => colorsKey.split("\u0000") as [string, string, ...string[]],
    [colorsKey]
  );

  const legendWidth = useMemo(() => getHeatmapLegendWidth(0, maxValue), [maxValue]);
  const defaultRight = showLegend ? legendWidth + LEGEND_GAP : 10;
  const defaultTop = 20;
  const labelBottomSpace = colLabelHeight + AXIS_LABEL_GAP + X_AXIS_TITLE_SPACE;
  const marg = margin ?? {
    top: defaultTop,
    left: maxRowNameWidth + AXIS_LABEL_GAP + Y_AXIS_TITLE_SPACE,
    right: defaultRight,
    bottom: labelBottomSpace + TICK_FONT_SIZE,
  };

  const availableWidth = Math.max(0, parentWidth - marg.left - marg.right);
  const availableHeight = Math.max(0, parentHeight - marg.bottom - marg.top);

  const xMax = isScrollable ? data.length * (cellWidth as number) : availableWidth;
  const yMax = isScrollable ? numRows * (cellHeight as number) : availableHeight;
  const viewportWidth = isScrollable ? Math.min(xMax, availableWidth) : xMax;
  const viewportHeight = isScrollable ? Math.min(yMax, availableHeight) : yMax;

  const yTitleWidth = Y_AXIS_TITLE_SPACE;
  const yTickLabelWidth = Math.max(0, marg.left - yTitleWidth);
  const xTitleHeight = X_AXIS_TITLE_SPACE;
  const xTickLabelHeight = Math.max(0, marg.bottom - xTitleHeight);

  const binWidth = xMax / data.length;
  const binHeight = yMax / numRows;

  const xScale = useMemo(
    () => scaleLinear<number>({ domain: [0, data.length], range: [0, xMax] }),
    [data.length, xMax]
  );
  const yScale = useMemo(
    () => scaleLinear<number>({ domain: [0, numRows], range: [yMax, 0] }),
    [numRows, yMax]
  );
  const cellYScale = useCallback((row: number) => yScale(row + 1), [yScale]);

  const xTickValues = useMemo(() => data.map((_, i) => i + 0.5), [data]);
  const yTickValues = useMemo(() => data[0]?.rows.map((_, i) => i + 0.5) ?? [], [data]);

  const resolvedDeselectedColor = deselectedColor ?? DEFAULT_DESELECTED_COLOR;
  const { colorScale, opacityScale } = useMemo(
    () => getHeatmapColorScales(stableColors, maxValue),
    [stableColors, maxValue]
  );
  const selectedKeys = useMemo(
    () => (selectedCells?.length ? new Set(selectedCells.map(cellKey)) : null),
    [selectedCells]
  );

  // Everything the canvas draw loop and hit-testing need to place/color a cell. Only changes when
  // a prop that actually affects appearance/geometry changes - never on scroll or hover, so
  // drawCanvas (and, through it, handleGridScroll) keeps a stable identity across scroll events.
  const canvasCellParams: CanvasCellParams = useMemo(
    () => ({
      data, numRows, xScale, cellYScale, colorScale, opacityScale, gap, isRect, binWidth, binHeight,
      yMax, selectedKeys, deselectedColor: resolvedDeselectedColor,
    }),
    [data, numRows, xScale, cellYScale, colorScale, opacityScale, gap, isRect, binWidth, binHeight, yMax, selectedKeys, resolvedDeselectedColor]
  );

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

  // Builds a standalone, off-DOM <svg> at full content size for export. Both the on-screen cell
  // layer (a canvas painting only the current scroll viewport) and the on-screen row/column axis
  // panes (SVGs now windowed to the visible tick range, see axisVisibleRange above) only ever
  // hold a slice of the full grid - neither can just be cloned for export without capturing an
  // incomplete/mispositioned snapshot. So all three (cells, row axis, column axis) are instead
  // rendered fresh here in one detached tree - synchronously, full grid, no windowing - purely to
  // snapshot into the export SVG below.
  const buildScrollableExportSVG = (): SVGSVGElement | null => {
    const exportSvg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
    exportSvg.setAttribute("width", String(marg.left + xMax + marg.right));
    exportSvg.setAttribute("height", String(marg.top + yMax + marg.bottom));

    const appendClone = (source: SVGSVGElement, x: number, y: number) => {
      const group = document.createElementNS(SVG_NS, "g");
      group.setAttribute("transform", `translate(${x},${y})`);
      source.childNodes.forEach((node) => group.appendChild(node.cloneNode(true)));
      exportSvg.appendChild(group);
    };

    let fullCells: SVGSVGElement | null = null;
    let fullRowAxis: SVGSVGElement | null = null;
    let fullColAxis: SVGSVGElement | null = null;
    const exportContainer = document.createElement("div");
    const exportRoot = createRoot(exportContainer);
    flushSync(() => {
      exportRoot.render(
        <>
          <svg width={xMax} height={yMax} ref={(el) => { fullCells = el; }}>
            <HeatmapCells
              data={data}
              xScale={xScale}
              yScale={cellYScale}
              colors={stableColors}
              maxValue={maxValue}
              gap={gap}
              isRect={isRect}
              binWidth={binWidth}
              binHeight={binHeight}
              animationType={animationType}
              onClick={onClick}
              selectedCells={selectedCells}
              deselectedColor={deselectedColor}
            />
          </svg>
          <svg width={yTickLabelWidth} height={yMax} ref={(el) => { fullRowAxis = el; }}>
            <g transform={`translate(${yTickLabelWidth},0)`}>
              <AxisLeft
                scale={yScale}
                numTicks={numRows}
                tickValues={yTickValues}
                tickFormat={yAxisTickFormat}
                tickLabelProps={yAxisTickLabelProps}
              />
            </g>
          </svg>
          <svg width={xMax} height={xTickLabelHeight} ref={(el) => { fullColAxis = el; }}>
            <AxisBottom
              top={0}
              scale={xScale}
              numTicks={data.length}
              tickFormat={xAxisTickFormat}
              tickValues={xTickValues}
              tickLabelProps={xAxisTickLabelProps}
            />
          </svg>
        </>
      );
    });
    if (fullCells) appendClone(fullCells, marg.left, marg.top);
    if (fullRowAxis) appendClone(fullRowAxis, yTitleWidth, marg.top);
    if (fullColAxis) appendClone(fullColAxis, marg.left, marg.top + yMax);
    exportRoot.unmount();

    if (showLegend && legendSvgRef.current) {
      appendClone(legendSvgRef.current, marg.left + xMax + LEGEND_GAP, marg.top);
    }

    // The axis titles live in their own always-visible panes on screen (so scrolling can't
    // carry them out of view) rather than as visx's built-in centered-on-the-full-axis label,
    // so they're added here directly instead of being cloned from a live pane.
    const appendTitle = (text: string, x: number, y: number, rotate: boolean) => {
      const titleEl = document.createElementNS(SVG_NS, "text");
      titleEl.setAttribute("x", String(x));
      titleEl.setAttribute("y", String(y));
      if (rotate) titleEl.setAttribute("transform", `rotate(-90, ${x}, ${y})`);
      titleEl.setAttribute("text-anchor", "middle");
      titleEl.setAttribute("dominant-baseline", "middle");
      titleEl.setAttribute("font-size", "14");
      titleEl.setAttribute("font-family", "sans-serif");
      titleEl.textContent = text;
      exportSvg.appendChild(titleEl);
    };
    if (yLabel) appendTitle(yLabel, yTitleWidth / 2, marg.top + yMax / 2, true);
    if (xLabel) appendTitle(xLabel, marg.left + xMax / 2, marg.top + yMax + xTickLabelHeight + xTitleHeight / 2, false);

    return exportSvg;
  };

  // downloadSVGAsPNG reads the element's layout box asynchronously (after its image loads), so
  // an off-DOM export node has to stay attached (off-screen) until onComplete fires. The
  // off-screen positioning goes on a wrapper div, never on the <svg> itself - that svg is what
  // gets serialized and downloaded, so any inline style set directly on it (e.g. `left:
  // -99999px`) would be baked into the exported file, rendering everything pushed off-canvas
  // and out of view - the exact "blank image" bug this replaced.
  const withOffscreenExportSVG = (run: (svg: SVGSVGElement, onDone: () => void) => void) => {
    const svg = buildScrollableExportSVG();
    if (!svg) return;
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.top = "0";
    wrapper.style.left = "-99999px";
    wrapper.appendChild(svg);
    document.body.appendChild(wrapper);
    run(svg, () => {
      if (wrapper.parentNode) document.body.removeChild(wrapper);
    });
  };

  useImperativeHandle(ref, () => ({
    downloadSVG: () => {
      if (isScrollable) {
        withOffscreenExportSVG((svg, onDone) => {
          downloadAsSVG(svg, downloadFileName ?? "heatmap.svg");
          onDone();
        });
      } else if (svgRef.current) {
        downloadAsSVG(svgRef.current, downloadFileName ?? "heatmap.svg");
      }
    },
    downloadPNG: () => {
      if (isScrollable) {
        withOffscreenExportSVG((svg, onDone) => {
          downloadSVGAsPNG(svg, downloadFileName ?? "heatmap.png", undefined, onDone);
        });
      } else if (svgRef.current) {
        downloadSVGAsPNG(svgRef.current, downloadFileName ?? "heatmap.png");
      }
    },
  }));
  // No deps array: buildScrollableExportSVG (and the plain closures above) now render the cells
  // and both axes fresh on every export (see its comment), reading a long list of render-scoped
  // values - hand-maintaining an exhaustive deps list for that is exactly the kind of duplicated
  // upkeep this refactor was trying to reduce elsewhere, and risks a stale export if one is ever
  // missed. Recomputing this handle (two small closures) on every render is negligible cost.

  const xAxisTickFormat = (d: number | { valueOf(): number }) => allColNames[Math.floor(+d)] ?? "";
  const xAxisTickLabelProps = () => ({
    fontSize: 12,
    fontFamily: "sans-serif",
    textAnchor: xTickTextAnchor,
    angle: xTickAngle,
    dy: xLabelOrientation === "horizontal" ? "0.71em" : "0.25em",
  });
  const xAxisLabelProps = {
    fontSize: 14,
    fontFamily: "sans-serif",
    textAnchor: "middle" as const,
    dy: "-0.5em",
  };
  const yAxisTickFormat = (d: number | { valueOf(): number }) => allRowNames[Math.floor(+d)] ?? "";
  const yAxisTickLabelProps = () => ({
    fontSize: 12,
    fontFamily: "sans-serif",
    textAnchor: "end" as const,
    dx: "-0.25em",
    dy: "0.25em",
  });
  const yAxisLabelProps = {
    fontSize: 14,
    fontFamily: "sans-serif",
    textAnchor: "middle" as const,
  };

  return (
    <ResponsiveContainer parentRef={parentRef} containerStyle={containerStyle}>
      {!parentWidth || !parentHeight || data.length === 0 || numRows === 0 ? null : isScrollable ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: showLegend
              ? `${yTitleWidth}px ${yTickLabelWidth}px ${viewportWidth}px ${LEGEND_GAP + legendWidth}px`
              : `${yTitleWidth}px ${yTickLabelWidth}px ${viewportWidth}px`,
            gridTemplateRows: `${marg.top}px ${viewportHeight}px ${xTickLabelHeight}px ${xTitleHeight}px`,
          }}
        >
          <div style={{ gridColumn: 1, gridRow: 2, width: yTitleWidth, height: viewportHeight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={yTitleWidth} height={viewportHeight}>
              <text
                x={yTitleWidth / 2}
                y={viewportHeight / 2}
                transform={`rotate(-90, ${yTitleWidth / 2}, ${viewportHeight / 2})`}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={14}
                fontFamily="sans-serif"
              >
                {yLabel ?? ""}
              </text>
            </svg>
          </div>
          <div style={{ gridColumn: 2, gridRow: 2, width: yTickLabelWidth, height: viewportHeight, overflow: "hidden" }}>
            <svg width={yTickLabelWidth} height={viewportHeight}>
              <g transform={`translate(${yTickLabelWidth},${-axisScrollPos.top})`}>
                <AxisLeft
                  scale={yScale}
                  numTicks={numRows}
                  tickValues={visibleYTickValues}
                  tickFormat={yAxisTickFormat}
                  tickLabelProps={yAxisTickLabelProps}
                />
              </g>
            </svg>
          </div>
          <div
            ref={mainPaneRef}
            onScroll={handleGridScroll}
            style={{ gridColumn: 3, gridRow: 2, width: viewportWidth, height: viewportHeight, overflow: "auto", overscrollBehavior: "contain", position: "relative" }}
          >
            <div style={{ width: xMax, height: yMax, position: "relative" }}>
              <canvas
                ref={canvasRef}
                width={viewportWidth * (window.devicePixelRatio || 1)}
                height={viewportHeight * (window.devicePixelRatio || 1)}
                style={{
                  width: viewportWidth,
                  height: viewportHeight,
                  position: "sticky",
                  top: 0,
                  left: 0,
                  display: "block",
                  cursor: "default",
                }}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
                onClick={handleCanvasClick}
              />
            </div>
          </div>
          {tooltipBody && <PlotTooltip ref={canvasTooltipRef}>{tooltipBody}</PlotTooltip>}
          <div style={{ gridColumn: 3, gridRow: 3, width: viewportWidth, height: xTickLabelHeight, overflow: "hidden" }}>
            <svg width={viewportWidth} height={xTickLabelHeight}>
              <g transform={`translate(${-axisScrollPos.left},0)`}>
                <AxisBottom
                  top={0}
                  scale={xScale}
                  numTicks={data.length}
                  tickFormat={xAxisTickFormat}
                  tickValues={visibleXTickValues}
                  tickLabelProps={xAxisTickLabelProps}
                />
              </g>
            </svg>
          </div>
          {/* X-axis title: fixed in place (not scroll-synced) so it's always visible, centered on
              the visible viewport rather than the full data range */}
          <div style={{ gridColumn: 3, gridRow: 4, width: viewportWidth, height: xTitleHeight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={viewportWidth} height={xTitleHeight}>
              <text
                x={viewportWidth / 2}
                y={xTitleHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={14}
                fontFamily="sans-serif"
              >
                {xLabel ?? ""}
              </text>
            </svg>
          </div>
          {showLegend && (
            <div style={{ gridColumn: 4, gridRow: 2, width: legendWidth, marginLeft: LEGEND_GAP, height: viewportHeight }}>
              {/* overflow: visible - the bottom-most tick label's center sits exactly at
                  viewportHeight (no slack below it, unlike the top-most tick which has binHeight
                  of slack above), so its lower half would otherwise be clipped by the svg's
                  default overflow: hidden. */}
              <svg width={legendWidth} height={viewportHeight} ref={legendSvgRef} style={{ overflow: "visible" }}>
                <g transform={`translate(0, ${binHeight})`}>
                  <HeatmapLegend
                    colors={stableColors}
                    minValue={0}
                    maxValue={maxValue}
                    height={Math.max(0, viewportHeight - binHeight)}
                  />
                </g>
              </svg>
            </div>
          )}
        </div>
      ) : (
        <svg width={parentWidth} height={parentHeight} ref={svgRef}>
          {/* Inside the <svg> so cell hover styling survives the SVG/PNG download serialization */}
          <style>{heatmapCellStyles}</style>
          <g transform={`translate(${marg.left},${marg.top})`}>
            <HeatmapCells
              data={data}
              xScale={xScale}
              yScale={cellYScale}
              colors={stableColors}
              maxValue={maxValue}
              gap={gap}
              isRect={isRect}
              binWidth={binWidth}
              binHeight={binHeight}
              animationType={animationType}
              tooltipBody={tooltipBody}
              onClick={onClick}
              selectedCells={selectedCells}
              deselectedColor={deselectedColor}
            />
            <AxisBottom
              top={yMax}
              scale={xScale}
              numTicks={data.length}
              tickFormat={xAxisTickFormat}
              tickValues={xTickValues}
              tickLabelProps={xAxisTickLabelProps}
              label={xLabel ?? ""}
              labelOffset={colLabelHeight + AXIS_LABEL_GAP}
              labelProps={xAxisLabelProps}
            />
            <AxisLeft
              scale={yScale}
              numTicks={numRows}
              tickValues={yTickValues}
              tickFormat={yAxisTickFormat}
              tickLabelProps={yAxisTickLabelProps}
              label={yLabel ?? ""}
              labelOffset={maxRowNameWidth + AXIS_LABEL_GAP}
              labelProps={yAxisLabelProps}
            />
            {showLegend && (
              <g transform={`translate(${xMax + LEGEND_GAP}, ${binHeight})`}>
                <HeatmapLegend
                  colors={stableColors}
                  minValue={0}
                  maxValue={maxValue}
                  height={yMax}
                />
              </g>
            )}
          </g>
        </svg>
      )}
    </ResponsiveContainer>
  );
};

export default Heatmap;
