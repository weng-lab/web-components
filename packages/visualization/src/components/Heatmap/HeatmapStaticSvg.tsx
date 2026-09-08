import { type ReactElement, type RefObject } from "react";
import { AxisLeft, AxisBottom } from "@visx/axis";
import type { ColumnDatum, HeatmapCellId } from "./types";
import type { AnimationType } from "../../utility";
import type { AnyBin } from "./HeatmapCells";
import HeatmapCells from "./HeatmapCells";
import { heatmapCellStyles } from "./HeatmapCell";
import HeatmapLegend from "./HeatmapLegend";
import { xAxisLabelProps, yAxisTickLabelProps, yAxisLabelProps, type getXAxisTickLabelProps } from "./heatmapAxisProps";
import { LEGEND_GAP, AXIS_LABEL_GAP, type HeatmapLayout } from "./heatmapLayout";

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
  selectedCells?: HeatmapCellId[];
  deselectedColor?: string;
  xLabel?: string;
  yLabel?: string;
  showLegend: boolean;
  xAxisTickFormat: (d: number | { valueOf(): number }) => string;
  yAxisTickFormat: (d: number | { valueOf(): number }) => string;
  xAxisTickLabelProps: ReturnType<typeof getXAxisTickLabelProps>;
}

const HeatmapStaticSvg = ({
  svgRef, layout, parentWidth, parentHeight, data, gap, isRect, animationType, tooltipBody,
  onClick, selectedCells, deselectedColor, xLabel, yLabel, showLegend,
  xAxisTickFormat, yAxisTickFormat, xAxisTickLabelProps,
}: HeatmapStaticSvgProps) => {
  const {
    marg, xMax, yMax, xScale, yScale, cellYScale, stableColors, minValue, maxValue,
    binWidth, binHeight, numRows, xTickValues, yTickValues, colLabelHeight, maxRowNameWidth, legendWidth,
  } = layout;

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
          <g transform={`translate(${xMax + LEGEND_GAP}, 0)`}>
            <HeatmapLegend
              colors={stableColors}
              minValue={minValue}
              maxValue={maxValue}
              height={yMax}
            />
          </g>
        )}
      </g>
    </svg>
  );
};

export default HeatmapStaticSvg;
