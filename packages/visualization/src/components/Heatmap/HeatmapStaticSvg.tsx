import { useMemo, type ReactElement, type ReactNode, type RefObject } from "react";
import { AxisLeft, AxisBottom } from "@visx/axis";
import type { ColumnDatum, HeatmapLegendFrame } from "./types";
import type { AnimationType } from "../../utility";
import type { AnyBin } from "./HeatmapCells";
import HeatmapCells from "./HeatmapCells";
import { heatmapCellStyles } from "./HeatmapCell";
import HeatmapLegend from "./HeatmapLegend";
import HeatmapSelectionPointers from "./HeatmapSelectionPointers";
import { xAxisLabelProps, yAxisTickLabelProps, yAxisLabelProps, markTickLabels, type getXAxisTickLabelProps } from "./heatmapAxisProps";
import { selectedCellsIn, selectionFrame } from "./heatmapSelection";
import { LEGEND_GAP, AXIS_LABEL_GAP, xAxisTitleCenter, type HeatmapLayout } from "./heatmapLayout";

export interface HeatmapStaticSvgProps {
  svgRef: RefObject<SVGSVGElement | null>;
  layout: HeatmapLayout;
  parentWidth: number;
  parentHeight: number;
  data: ColumnDatum[];
  gap: number;
  isRect: boolean;
  animationType?: AnimationType;
  tooltipBody?: (bin: AnyBin) => ReactElement;
  onClick?: (bin: AnyBin) => void;
  xLabel?: string;
  yLabel?: string;
  showLegend: boolean;
  renderLegend?: (frame: HeatmapLegendFrame) => ReactNode;
  xAxisTickFormat: (d: number | { valueOf(): number }) => string;
  yAxisTickFormat: (d: number | { valueOf(): number }) => string;
  xAxisTickLabelProps: ReturnType<typeof getXAxisTickLabelProps>;
}

const HeatmapStaticSvg = ({
  svgRef, layout, parentWidth, parentHeight, data, gap, isRect, animationType, tooltipBody,
  onClick, xLabel, yLabel, showLegend, renderLegend,
  xAxisTickFormat, yAxisTickFormat, xAxisTickLabelProps,
}: HeatmapStaticSvgProps) => {
  const {
    marg, xMax, yMax, xScale, yScale, cellYScale, stableColors, minValue, maxValue,
    binWidth, binHeight, numRows, xTickValues, yTickValues, colLabelHeight, maxRowNameWidth, legendWidth,
    highlightRange, selectedKeys, selectionMarks,
  } = layout;
  // Every selected cell is in view on a grid this size, so the frame is worked out whole.
  const frame = selectedKeys
    ? selectionFrame(
        selectedKeys,
        selectedCellsIn(selectedKeys, { colStart: 0, colEnd: data.length - 1, rowStart: 0, rowEnd: numRows - 1 }),
        { xScale, cellYScale, binWidth, binHeight, gap },
        { width: xMax, height: yMax }
      )
    : [];

  const xAxisTitleLabelProps = useMemo(
    () =>
      xLabel
        ? { ...xAxisLabelProps, x: xAxisTitleCenter(xLabel, marg.left + xMax / 2, parentWidth) - marg.left }
        : xAxisLabelProps,
    [xLabel, marg.left, xMax, parentWidth]
  );

  return (
    <svg width={parentWidth} height={parentHeight} ref={svgRef}>
      {/* Inside the <svg> so cell hover styling survives the SVG/PNG download serialization */}
      <style>{heatmapCellStyles}</style>
      <g transform={`translate(${marg.left},${marg.top})`}>
        <HeatmapCells
          data={data}
          xScale={xScale}
          yScale={cellYScale}
          colors={stableColors}
          minValue={minValue}
          maxValue={maxValue}
          gap={gap}
          isRect={isRect}
          binWidth={binWidth}
          binHeight={binHeight}
          animationType={animationType}
          tooltipBody={tooltipBody}
          onClick={onClick}
          highlightRange={highlightRange}
        />
        {frame.length > 0 && (
          <g pointerEvents="none">
            {frame.map((band, i) => (
              <rect key={i} {...band} />
            ))}
          </g>
        )}
        <AxisBottom
          top={yMax}
          scale={xScale}
          numTicks={data.length}
          tickFormat={xAxisTickFormat}
          tickValues={xTickValues}
          tickLabelProps={markTickLabels(xAxisTickLabelProps, selectionMarks.columns)}
          label={xLabel ?? ""}
          labelOffset={colLabelHeight + AXIS_LABEL_GAP}
          labelProps={xAxisTitleLabelProps}
        />
        <AxisLeft
          scale={yScale}
          numTicks={numRows}
          tickValues={yTickValues}
          tickFormat={yAxisTickFormat}
          tickLabelProps={markTickLabels(yAxisTickLabelProps, selectionMarks.rows)}
          label={yLabel ?? ""}
          labelOffset={maxRowNameWidth + AXIS_LABEL_GAP}
          labelProps={yAxisLabelProps}
        />
        <g transform={`translate(0,${yMax})`}>
          <HeatmapSelectionPointers axis="column" marked={selectionMarks.columns} scale={xScale} />
        </g>
        <HeatmapSelectionPointers axis="row" marked={selectionMarks.rows} scale={yScale} />
        {showLegend && (
          <g transform={`translate(${xMax + LEGEND_GAP}, 0)`}>
            {renderLegend ? (
              renderLegend({ width: legendWidth, height: yMax, orientation: "vertical" })
            ) : (
              <HeatmapLegend
                colors={stableColors}
                minValue={minValue}
                maxValue={maxValue}
                length={yMax}
              />
            )}
          </g>
        )}
      </g>
    </svg>
  );
};

export default HeatmapStaticSvg;
