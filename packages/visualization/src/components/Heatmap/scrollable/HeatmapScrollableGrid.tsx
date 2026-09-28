import { useCallback, useId, useMemo, useRef, useState, type ReactElement, type ReactNode, type RefObject } from "react";
import { AxisLeft, AxisBottom } from "@visx/axis";
import type { ColumnDatum, HeatmapCellId, HeatmapLegendFrame } from "../types";
import type { AnyBin } from "../HeatmapCells";
import HeatmapLegend from "../HeatmapLegend";
import HeatmapSelectionPointers from "../HeatmapSelectionPointers";
import HeatmapMiniMap from "./HeatmapMiniMap";
import HeatmapMiniMapPopup from "./HeatmapMiniMapPopup";
import { PlotTooltip } from "../../../tooltip";
import { TICK_FONT_FAMILY, AXIS_TITLE_FONT_SIZE, markTickLabels, yAxisTickLabelProps, type getXAxisTickLabelProps } from "../heatmapAxisProps";
import { LEGEND_GAP, MINI_MAP_HEIGHT, type HeatmapLayout } from "../heatmapLayout";
import { useHeatmapCanvasGrid } from "../hooks/useHeatmapCanvasGrid";
import { useScrollToSelection } from "../hooks/useScrollToSelection";

const X_AXIS_OVERHANG_CLIP_HEIGHT = 10;

export interface HeatmapScrollableGridProps {
  legendSvgRef: RefObject<SVGSVGElement | null>;
  layout: HeatmapLayout;
  data: ColumnDatum[];
  showMiniMap: boolean;
  showLegend: boolean;
  renderLegend?: (frame: HeatmapLegendFrame) => ReactNode;
  xLabel?: string;
  yLabel?: string;
  tooltipBody?: (bin: AnyBin) => ReactElement;
  onClick?: (bin: AnyBin) => void;
  selectedCells?: HeatmapCellId[];
  scrollToSelection?: boolean;
  xAxisTickFormat: (d: number | { valueOf(): number }) => string;
  yAxisTickFormat: (d: number | { valueOf(): number }) => string;
  xAxisTickLabelProps: ReturnType<typeof getXAxisTickLabelProps>;
}

const HeatmapScrollableGrid = ({
  legendSvgRef, layout, data, showMiniMap, showLegend, renderLegend, xLabel, yLabel, tooltipBody, onClick,
  selectedCells, scrollToSelection, xAxisTickFormat, yAxisTickFormat, xAxisTickLabelProps,
}: HeatmapScrollableGridProps) => {
  const {
    numRows, marg, xMax, yMax, viewportWidth, viewportHeight, yTitleWidth, yTickLabelWidth,
    xTitleHeight, xTickLabelHeight, binWidth, xTickLeftOverhangMax, legendWidth,
    xScale, yScale, xTickValues, yTickValues, stableColors, minValue, maxValue, canvasCellParams,
    selectionMarks,
  } = layout;
  const markedXTickLabelProps = useMemo(
    () => markTickLabels(xAxisTickLabelProps, selectionMarks.columns),
    [xAxisTickLabelProps, selectionMarks]
  );
  const markedYTickLabelProps = useMemo(() => markTickLabels(yAxisTickLabelProps, selectionMarks.rows), [selectionMarks]);

  const {
    canvasRef, mainPaneRef, canvasTooltipRef, setMainPaneNode, handleGridScroll, axisScrollPos,
    visibleXTickValues, visibleYTickValues, canvasHandlers,
  } = useHeatmapCanvasGrid({
    canvasCellParams, viewportWidth, viewportHeight, xTickValues, yTickValues, onClick,
  });
  useScrollToSelection({ mainPaneRef, selectedCells, scrollToSelection, binWidth, viewportWidth });

  const xTickClipId = useId();
  // Room for the first column's slanted label to hang left over the y-axis pane, only while
  // scrolled to the start: anywhere else, the column to its left would show through.
  const xTickLeftOverhang = Math.max(0, xTickLeftOverhangMax - axisScrollPos.left);

  // The resulting scroll event repaints the grid and moves the minimap's rectangle, as a manual scroll does.
  const handleMiniMapNavigate = useCallback((left: number, top: number) => {
    mainPaneRef.current?.scrollTo({ left, top });
  }, []);

  const [isMiniMapExpanded, setIsMiniMapExpanded] = useState(false);
  const miniMapContainerRef = useRef<HTMLDivElement | null>(null);

  // The caller's legend or the built-in one, beside the grid or across the expanded minimap.
  const legend = (frame: HeatmapLegendFrame) =>
    renderLegend ? (
      renderLegend(frame)
    ) : (
      <HeatmapLegend
        colors={stableColors}
        minValue={minValue}
        maxValue={maxValue}
        length={frame.orientation === "vertical" ? frame.height : frame.width}
        orientation={frame.orientation}
      />
    );

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {showMiniMap && (
          <div ref={miniMapContainerRef} style={{ marginLeft: yTitleWidth + yTickLabelWidth, position: "relative", width: viewportWidth }}>
            <HeatmapMiniMap
              canvasCellParams={canvasCellParams}
              xMax={xMax}
              yMax={yMax}
              viewportWidth={viewportWidth}
              viewportHeight={viewportHeight}
              scrollLeft={axisScrollPos.left}
              scrollTop={axisScrollPos.top}
              width={viewportWidth}
              height={MINI_MAP_HEIGHT}
              onNavigate={handleMiniMapNavigate}
              onCanvasClick={() => setIsMiniMapExpanded(true)}
              paused={isMiniMapExpanded}
            />
          </div>
        )}
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
                fontSize={AXIS_TITLE_FONT_SIZE}
                fontFamily={TICK_FONT_FAMILY}
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
                  tickLabelProps={markedYTickLabelProps}
                />
                <HeatmapSelectionPointers axis="row" marked={selectionMarks.rows} scale={yScale} />
              </g>
            </svg>
          </div>
          <div
            ref={setMainPaneNode}
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
                {...canvasHandlers}
              />
            </div>
          </div>
          {tooltipBody && <PlotTooltip ref={canvasTooltipRef}>{tooltipBody}</PlotTooltip>}
          <div style={{ gridColumn: 3, gridRow: 3, width: viewportWidth, height: xTickLabelHeight, overflow: "visible" }}>
            <svg width={viewportWidth} height={xTickLabelHeight} style={{ overflow: "visible" }}>
              <defs>
                <clipPath id={xTickClipId}>
                  <rect x={0} y={0} width={viewportWidth} height={xTickLabelHeight} />
                  {xTickLeftOverhangMax > 0 && (
                    <rect
                      x={-xTickLeftOverhang}
                      y={X_AXIS_OVERHANG_CLIP_HEIGHT}
                      width={xTickLeftOverhang}
                      height={Math.max(0, xTickLabelHeight - X_AXIS_OVERHANG_CLIP_HEIGHT)}
                    />
                  )}
                </clipPath>
              </defs>
              <g clipPath={`url(#${xTickClipId})`}>
                <g transform={`translate(${-axisScrollPos.left},0)`}>
                  <AxisBottom
                    top={0}
                    scale={xScale}
                    numTicks={data.length}
                    tickFormat={xAxisTickFormat}
                    tickValues={visibleXTickValues}
                    tickLabelProps={markedXTickLabelProps}
                  />
                  <HeatmapSelectionPointers axis="column" marked={selectionMarks.columns} scale={xScale} />
                </g>
              </g>
            </svg>
          </div>
          {/* X-axis title: fixed in place (not scroll-synced) so it's always visible, centered on
              the visible viewport rather than the full data range. overflow: visible lets a title
              wider than the viewport (e.g. very few columns) spill symmetrically into the
              y-tick-label and legend panes' columns - harmless since neither has content in this
              row - rather than being clipped at the viewport's own edge. */}
          <div style={{ gridColumn: 3, gridRow: 4, width: viewportWidth, height: xTitleHeight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={viewportWidth} height={xTitleHeight} style={{ overflow: "visible" }}>
              <text
                x={viewportWidth / 2}
                y={xTitleHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={AXIS_TITLE_FONT_SIZE}
                fontFamily={TICK_FONT_FAMILY}
              >
                {xLabel ?? ""}
              </text>
            </svg>
          </div>
          {showLegend && (
            <div style={{ gridColumn: 4, gridRow: 2, width: legendWidth, marginLeft: LEGEND_GAP, height: viewportHeight }}>
              <svg width={legendWidth} height={viewportHeight} ref={legendSvgRef} style={{ overflow: "visible" }}>
                {legend({ width: legendWidth, height: viewportHeight, orientation: "vertical" })}
              </svg>
            </div>
          )}
        </div>
      </div>
      {showMiniMap && isMiniMapExpanded && (
        <HeatmapMiniMapPopup
          onClose={() => setIsMiniMapExpanded(false)}
          containerRef={miniMapContainerRef}
          canvasCellParams={canvasCellParams}
          xMax={xMax}
          yMax={yMax}
          viewportWidth={viewportWidth}
          viewportHeight={viewportHeight}
          scrollLeft={axisScrollPos.left}
          scrollTop={axisScrollPos.top}
          onNavigate={handleMiniMapNavigate}
          legend={showLegend ? legend : undefined}
        />
      )}
    </>
  );
};

export default HeatmapScrollableGrid;
