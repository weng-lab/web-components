import { scaleLinear } from "@visx/scale";
import type { HeatmapProps, ColumnDatum } from "./types";
import { useImperativeHandle, useRef, useMemo, useCallback } from "react";
import { downloadAsSVG, downloadSVGAsPNG, measureTextWidth } from "../../utility";
import { ResponsiveContainer, useResponsiveParentSize } from "../../responsive";
import { AxisLeft, AxisBottom } from "@visx/axis";
import HeatmapCells from "./HeatmapCells";
import { heatmapCellStyles } from "./HeatmapCell";
import HeatmapLegend, { getHeatmapLegendWidth } from "./HeatmapLegend";

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

  // Frozen-pane refs: only used when isScrollable. The cell grid, row-label axis, and
  // column-label axis each live in their own <svg> in their own scroll container, kept in
  // sync by mirroring scroll position (see handleGridScroll below).
  const mainPaneRef = useRef<HTMLDivElement | null>(null);
  const rowLabelPaneRef = useRef<HTMLDivElement | null>(null);
  const colLabelPaneRef = useRef<HTMLDivElement | null>(null);
  const cellsSvgRef = useRef<SVGSVGElement | null>(null);
  const rowAxisSvgRef = useRef<SVGSVGElement | null>(null);
  const colAxisSvgRef = useRef<SVGSVGElement | null>(null);
  const legendSvgRef = useRef<SVGSVGElement | null>(null);

  const handleGridScroll = useCallback(() => {
    const main = mainPaneRef.current;
    if (!main) return;
    if (rowLabelPaneRef.current) rowLabelPaneRef.current.scrollTop = main.scrollTop;
    if (colLabelPaneRef.current) colLabelPaneRef.current.scrollLeft = main.scrollLeft;
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
  // Full-length rotated (vertical) labels need the most vertical space (their rendered width
  // becomes vertical space once rotated), diagonal labels need proportionally less (sin of a
  // 45deg rotation), and horizontal labels only need a single line.
  const rotatedColNameSpace = maxColNameWidth;
  const colLabelHeight = xLabelOrientation === "horizontal" ? 12 : xLabelOrientation === "vertical" ? rotatedColNameSpace : rotatedColNameSpace * Math.SQRT1_2;

  // Consumers nearly always pass `colors` as an inline array literal, so its identity changes on
  // every render of theirs. That alone rebuilds the color scale and, through it, every cell in the
  // grid. Keying on the contents means the array is only replaced when the colors really change.
  // (A NUL separator cannot appear in a CSS color, so the join is unambiguous.)
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
    // The x-axis is drawn immediately at yMax, right below the last row of cells. @visx/axis's
    // Ticks renderer adds a further `fontSize` px downward shift for AxisBottom specifically (see
    // Ticks.js: tickYCoord = to.y + fontSize) before rotating the label into place, so the bottom
    // margin needs labelBottomSpace plus that shift, or the tick-label pane ends up sized with no
    // real slack and clips as soon as a label is a little longer than estimated.
    bottom: labelBottomSpace + TICK_FONT_SIZE,
  };

  const availableWidth = Math.max(0, parentWidth - marg.left - marg.right);
  const availableHeight = Math.max(0, parentHeight - marg.bottom - marg.top);

  // xMax/yMax are the full content size the cell grid needs. In scrollable mode that's driven
  // by the fixed cell size rather than clamped to the available space, so it can exceed it -
  // the viewport (below) is what actually gets clamped, and scrolls to reveal the rest.
  const xMax = isScrollable ? data.length * (cellWidth as number) : availableWidth;
  const yMax = isScrollable ? numRows * (cellHeight as number) : availableHeight;
  const viewportWidth = isScrollable ? Math.min(xMax, availableWidth) : xMax;
  const viewportHeight = isScrollable ? Math.min(yMax, availableHeight) : yMax;

  // In scrollable mode marg.left/marg.bottom are split into a tick-label pane (which scrolls in
  // sync with the cell grid) and a title pane (which never scrolls, so the axis title can't be
  // scrolled out of view - see the "always know what axis you're looking at" panes below).
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
  // @visx/heatmap's HeatmapRect/HeatmapCircle place row r at yScale(r) and grow *downward* from
  // there by binHeight - with yScale's range reversed ([yMax, 0]), that puts row 0 below yMax
  // (overflowing the bottom of the grid) and leaves row numRows-1 short of y=0 (a gap at the
  // top), rather than filling [0, yMax] flush. Feeding it yScale(row + 1) instead cancels that
  // one-row shift so the cells land exactly where yScale (and the row axis below, which uses it
  // unshifted) says they should.
  const cellYScale = useCallback((row: number) => yScale(row + 1), [yScale]);

  const xTickValues = useMemo(() => data.map((_, i) => i + 0.5), [data]);
  const yTickValues = useMemo(() => data[0]?.rows.map((_, i) => i + 0.5) ?? [], [data]);

  // Builds a standalone, off-DOM <svg> at full content size by cloning the three live panes
  // (cells, row axis, column axis, legend) into one coordinate space - the same layout the
  // non-scrollable branch renders directly. Used only for export, so the always-visible panes
  // never have to render the full (potentially huge) grid twice.
  const buildScrollableExportSVG = (): SVGSVGElement | null => {
    const cells = cellsSvgRef.current;
    const rowAxis = rowAxisSvgRef.current;
    const colAxis = colAxisSvgRef.current;
    if (!cells || !rowAxis || !colAxis) return null;

    const exportSvg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
    exportSvg.setAttribute("width", String(marg.left + xMax + marg.right));
    exportSvg.setAttribute("height", String(marg.top + yMax + marg.bottom));

    const appendClone = (source: SVGSVGElement, x: number, y: number) => {
      const group = document.createElementNS(SVG_NS, "g");
      group.setAttribute("transform", `translate(${x},${y})`);
      source.childNodes.forEach((node) => group.appendChild(node.cloneNode(true)));
      exportSvg.appendChild(group);
    };

    appendClone(cells, marg.left, marg.top);
    appendClone(rowAxis, yTitleWidth, marg.top);
    appendClone(colAxis, marg.left, marg.top + yMax);
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
  }), [downloadFileName, isScrollable, marg.left, marg.top, marg.right, marg.bottom, xMax, yMax, showLegend, yLabel, xLabel, xTickLabelHeight, xTitleHeight, yTitleWidth]);

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

  const cellsSvg = (ref: React.Ref<SVGSVGElement>) => (
    <svg width={xMax} height={yMax} ref={ref}>
      {/* Inside the <svg> so cell hover styling survives the SVG/PNG download serialization */}
      <style>{heatmapCellStyles}</style>
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
    </svg>
  );

  return (
    <ResponsiveContainer parentRef={parentRef} containerStyle={containerStyle}>
      {/* Prevent an undefined parent size, or empty data, from producing elements with negative
          or non-finite dimensions */}
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
          {/* Y-axis title: fixed in place (not scroll-synced) so it's always visible, unlike the
              tick labels it stays centered on the visible viewport rather than the full data range */}
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
          {/* Row tick labels: pinned to the left, vertical scroll mirrored from the cell grid */}
          <div
            ref={rowLabelPaneRef}
            style={{ gridColumn: 2, gridRow: 2, width: yTickLabelWidth, height: viewportHeight, overflow: "hidden" }}
          >
            <svg width={yTickLabelWidth} height={yMax} ref={rowAxisSvgRef}>
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
          </div>
          {/* Cell grid: the only pane with a visible, user-driven scrollbar (both axes) */}
          <div
            ref={mainPaneRef}
            onScroll={handleGridScroll}
            style={{ gridColumn: 3, gridRow: 2, width: viewportWidth, height: viewportHeight, overflow: "auto", overscrollBehavior: "contain" }}
          >
            {cellsSvg(cellsSvgRef)}
          </div>
          {/* Column tick labels: pinned under the cell grid, horizontal scroll mirrored from it */}
          <div
            ref={colLabelPaneRef}
            style={{ gridColumn: 3, gridRow: 3, width: viewportWidth, height: xTickLabelHeight, overflow: "hidden" }}
          >
            <svg width={xMax} height={xTickLabelHeight} ref={colAxisSvgRef}>
              <AxisBottom
                top={0}
                scale={xScale}
                numTicks={data.length}
                tickFormat={xAxisTickFormat}
                tickValues={xTickValues}
                tickLabelProps={xAxisTickLabelProps}
              />
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
