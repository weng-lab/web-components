import type { HeatmapProps } from "./types";
import { useImperativeHandle, useRef, useMemo } from "react";
import { downloadAsSVG } from "../../utility";
import { ResponsiveContainer, useResponsiveParentSize } from "../../responsive";
import { makeTickFormat, getXAxisTickLabelProps } from "./heatmapAxisProps";
import { useHeatmapLayout } from "./heatmapLayout";
import { withOffscreenExportSVG, downloadHeatmapPNG } from "./heatmapExport";
import HeatmapGrid from "./HeatmapGrid";

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
  const legendSvgRef = useRef<SVGSVGElement | null>(null);

  const layout = useHeatmapLayout({
    data, colorDomain, colors, xLabelOrientation, margin, showLegend,
    cellWidth, cellHeight, parentWidth, parentHeight, showMiniMap, gap, isRect,
    selectedCells, highlightRange, legendWidth,
  });
  const { allColNames, allRowNames, numRows } = layout;

  const xAxisTickFormat = useMemo(() => makeTickFormat(allColNames), [allColNames]);
  const yAxisTickFormat = useMemo(() => makeTickFormat(allRowNames), [allRowNames]);
  const xAxisTickLabelProps = useMemo(() => getXAxisTickLabelProps(xLabelOrientation), [xLabelOrientation]);

  const buildExportOptions = () => ({
    layout, xLabel, yLabel, showLegend, legendSvg: legendSvgRef.current,
    xAxisTickFormat, yAxisTickFormat, xAxisTickLabelProps,
  });

  // The grid on screen holds only what's in view, so downloads draw the whole plot afresh.
  useImperativeHandle(ref, () => ({
    downloadSVG: () =>
      withOffscreenExportSVG(buildExportOptions(), (svg, onDone) => {
        downloadAsSVG(svg, downloadFileName ?? "heatmap.svg");
        onDone();
      }),
    downloadPNG: () => downloadHeatmapPNG(buildExportOptions(), downloadFileName ?? "heatmap.png"),
  }));
  // No deps array: the exports read many render-scoped values, and rebuilding two closures per
  // render is cheaper than a deps list that could go stale.

  return (
    <ResponsiveContainer parentRef={parentRef} containerStyle={containerStyle}>
      {!parentWidth || !parentHeight || data.length === 0 || numRows === 0 ? null : (
        <HeatmapGrid
          legendSvgRef={legendSvgRef}
          layout={layout}
          parentWidth={parentWidth}
          showMiniMap={showMiniMap}
          showLegend={showLegend}
          renderLegend={renderLegend}
          xLabel={xLabel}
          yLabel={yLabel}
          tooltipBody={tooltipBody}
          onClick={onClick}
          animationType={animationType}
          selectedCells={selectedCells}
          scrollToSelection={scrollToSelection}
          xAxisTickFormat={xAxisTickFormat}
          yAxisTickFormat={yAxisTickFormat}
          xAxisTickLabelProps={xAxisTickLabelProps}
        />
      )}
    </ResponsiveContainer>
  );
};

export default Heatmap;
