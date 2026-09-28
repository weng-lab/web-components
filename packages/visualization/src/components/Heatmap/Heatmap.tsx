import type { HeatmapProps } from "./types";
import { useImperativeHandle, useRef, useMemo } from "react";
import { downloadAsSVG, downloadSVGAsPNG } from "../../utility";
import { ResponsiveContainer, useResponsiveParentSize } from "../../responsive";
import { makeTickFormat, getXAxisTickLabelProps } from "./heatmapAxisProps";
import { useHeatmapLayout } from "./heatmapLayout";
import { withOffscreenExportSVG, downloadScrollableHeatmapPNG } from "./scrollable/heatmapExport";
import HeatmapScrollableGrid from "./scrollable/HeatmapScrollableGrid";
import HeatmapStaticSvg from "./HeatmapStaticSvg";

const Heatmap = ({
  data,
  onClick,
  ref,
  downloadFileName,
  colors,
  colorDomain,
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
  cellWidth,
  cellHeight,
  scrollToSelection,
  showMiniMap = false,
  renderLegend,
  legendWidth,
  highlightRange,
}: HeatmapProps) => {
  const { parentRef, containerStyle, width: parentWidth, height: parentHeight } = useResponsiveParentSize({ width, height });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const legendSvgRef = useRef<SVGSVGElement | null>(null);
  const isScrollable = cellWidth != null && cellHeight != null;

  const layout = useHeatmapLayout({
    data, colorDomain, colors, xLabelOrientation, margin, showLegend, isScrollable,
    cellWidth, cellHeight, parentWidth, parentHeight, showMiniMap, gap, isRect,
    selectedCells, highlightRange, legendWidth,
  });
  const { allColNames, allRowNames, numRows } = layout;

  const xAxisTickFormat = useMemo(() => makeTickFormat(allColNames), [allColNames]);
  const yAxisTickFormat = useMemo(() => makeTickFormat(allRowNames), [allRowNames]);
  const xAxisTickLabelProps = useMemo(() => getXAxisTickLabelProps(xLabelOrientation), [xLabelOrientation]);

  const buildExportOptions = () => ({
    layout, data, xLabel, yLabel, showLegend, legendSvg: legendSvgRef.current,
    xAxisTickFormat, yAxisTickFormat, xAxisTickLabelProps,
  });

  useImperativeHandle(ref, () => ({
    downloadSVG: () => {
      if (isScrollable) {
        withOffscreenExportSVG(buildExportOptions(), (svg, onDone) => {
          downloadAsSVG(svg, downloadFileName ?? "heatmap.svg");
          onDone();
        });
      } else if (svgRef.current) {
        downloadAsSVG(svgRef.current, downloadFileName ?? "heatmap.svg");
      }
    },
    downloadPNG: () => {
      if (isScrollable) {
        downloadScrollableHeatmapPNG(buildExportOptions(), downloadFileName ?? "heatmap.png");
      } else if (svgRef.current) {
        downloadSVGAsPNG(svgRef.current, downloadFileName ?? "heatmap.png");
      }
    },
  }));
  // No deps array: the exports read many render-scoped values, and rebuilding two closures per
  // render is cheaper than a deps list that could go stale.

  return (
    <ResponsiveContainer parentRef={parentRef} containerStyle={containerStyle}>
      {!parentWidth || !parentHeight || data.length === 0 || numRows === 0 ? null : isScrollable ? (
        <HeatmapScrollableGrid
          legendSvgRef={legendSvgRef}
          layout={layout}
          data={data}
          showMiniMap={showMiniMap}
          showLegend={showLegend}
          renderLegend={renderLegend}
          xLabel={xLabel}
          yLabel={yLabel}
          tooltipBody={tooltipBody}
          onClick={onClick}
          selectedCells={selectedCells}
          scrollToSelection={scrollToSelection}
          xAxisTickFormat={xAxisTickFormat}
          yAxisTickFormat={yAxisTickFormat}
          xAxisTickLabelProps={xAxisTickLabelProps}
        />
      ) : (
        <HeatmapStaticSvg
          svgRef={svgRef}
          layout={layout}
          parentWidth={parentWidth}
          parentHeight={parentHeight}
          data={data}
          gap={gap}
          isRect={isRect}
          animationType={animationType}
          tooltipBody={tooltipBody}
          onClick={onClick}
          xLabel={xLabel}
          yLabel={yLabel}
          showLegend={showLegend}
          renderLegend={renderLegend}
          xAxisTickFormat={xAxisTickFormat}
          yAxisTickFormat={yAxisTickFormat}
          xAxisTickLabelProps={xAxisTickLabelProps}
        />
      )}
    </ResponsiveContainer>
  );
};

export default Heatmap;
