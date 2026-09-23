import { useMemo, type ReactElement, type RefObject } from "react";
import { AxisLeft, AxisBottom } from "@visx/axis";
import type { ColumnDatum, HeatmapCellId } from "./types";
import { measureTextWidth, type AnimationType } from "../../utility";
import type { AnyBin } from "./HeatmapCells";
import HeatmapCells from "./HeatmapCells";
import { heatmapCellStyles } from "./HeatmapCell";
import HeatmapLegend from "./HeatmapLegend";
import { xAxisLabelProps, yAxisTickLabelProps, yAxisLabelProps, AXIS_TITLE_FONT_SIZE, TICK_FONT_FAMILY, type getXAxisTickLabelProps } from "./heatmapAxisProps";
import { LEGEND_GAP, AXIS_LABEL_GAP, TICK_LABEL_WIDTH_SAFETY_FACTOR, type HeatmapLayout } from "./heatmapLayout";

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

  // The title defaults to centered over the plot area (xMax), matching the tick labels it sits
  // below - but with few enough columns, xMax can be much narrower than the title itself, which
  // would otherwise run the title's overhanging half off the SVG's fixed-size canvas. Clamping
  // its center into [titleWidth/2, parentWidth - titleWidth/2] keeps the default (title fits)
  // behavior unchanged and only pulls it back into bounds when it wouldn't otherwise fit.
  const xAxisTitleLabelProps = useMemo(() => {
    if (!xLabel) return xAxisLabelProps;
    const titleWidth = measureTextWidth(xLabel, AXIS_TITLE_FONT_SIZE, TICK_FONT_FAMILY) * TICK_LABEL_WIDTH_SAFETY_FACTOR;
    const defaultCenter = marg.left + xMax / 2;
    const center = titleWidth >= parentWidth
      ? parentWidth / 2
      : Math.min(Math.max(defaultCenter, titleWidth / 2), parentWidth - titleWidth / 2);
    return { ...xAxisLabelProps, x: center - marg.left };
  }, [xLabel, marg.left, xMax, parentWidth]);

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
          labelProps={xAxisTitleLabelProps}
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
