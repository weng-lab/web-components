import { scaleLinear } from "@visx/scale";
import type { HeatmapProps, ColumnDatum } from "./types";
import { useImperativeHandle, useRef, useMemo } from "react";
import { downloadAsSVG, downloadSVGAsPNG } from "../../utility";
import { ResponsiveContainer, useResponsiveParentSize } from "../../responsive";
import { AxisLeft, AxisBottom } from "@visx/axis";
import HeatmapCells from "./HeatmapCells";
import HeatmapLegend, { getHeatmapLegendWidth } from "./HeatmapLegend";

const LEGEND_GAP = 16;
// Extra breathing room between the tick labels and the axis title, beyond the space
// reserved for the tick labels themselves.
const AXIS_LABEL_GAP = 12;
const getBins = (d: ColumnDatum) => d.rows;

function maxOf<Datum>(data: Datum[], value: (d: Datum) => number): number {
  return Math.max(...data.map(value));
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
}: HeatmapProps) => {
  const { parentRef, containerStyle, width: parentWidth, height: parentHeight } = useResponsiveParentSize({ width, height });
  const svgRef = useRef<SVGSVGElement | null>(null);

  const allColNames = useMemo(() => data.map((d) => d.columnName), [data]);
  const allRowNames = useMemo(() => data[0].rows.map((r) => r.rowName), [data]);
  const maxValue = useMemo(() => maxOf(data, (d) => maxOf(getBins(d), (r) => r.count)), [data]);
  const numRows = useMemo(() => maxOf(data, (d) => getBins(d).length), [data]);

  const maxColNameLength = allColNames.reduce((m, name) => Math.max(m, name.length), 0);
  const maxRowNameLength = allRowNames.reduce((m, name) => Math.max(m, name.length), 0);

  const xTickAngle = xLabelOrientation === "horizontal" ? 0 : xLabelOrientation === "vertical" ? -90 : xLabelOrientation === "leftDiagonal" ? -45 : 45;
  const xTickTextAnchor = xLabelOrientation === "horizontal" ? "middle" : xLabelOrientation === "rightDiagonal" ? "start" : "end";
  // Full-length rotated (vertical) labels need the most vertical space, diagonal labels need
  // proportionally less (sin of a 45deg rotation), and horizontal labels only need a single line.
  const rotatedColNameSpace = maxColNameLength * 8;
  const colLabelHeight = xLabelOrientation === "horizontal" ? 12 : xLabelOrientation === "vertical" ? rotatedColNameSpace : rotatedColNameSpace * Math.SQRT1_2;

  const legendWidth = useMemo(() => getHeatmapLegendWidth(0, maxValue), [maxValue]);
  const defaultRight = showLegend ? legendWidth + LEGEND_GAP : 10;
  const defaultTop = 20;
  // Solve for bottom margin so that (bottom - binHeight) always equals the space needed for
  // rotated column labels. binHeight = (parentHeight - top - bottom) / numRows, so:
  // bottom = (labelSpace * numRows + parentHeight - top) / (numRows + 1)
  const labelBottomSpace = colLabelHeight + AXIS_LABEL_GAP + 70;
  const marg = margin ?? {
    top: defaultTop,
    left: maxRowNameLength * 8 + AXIS_LABEL_GAP + 40,
    right: defaultRight,
    bottom: (labelBottomSpace * numRows + Math.max(0, parentHeight - defaultTop)) / (numRows + 1),
  };

  const xMax = parentWidth > marg.left + marg.right ? parentWidth - marg.left - marg.right : parentWidth;
  const yMax = parentHeight - marg.bottom - marg.top;

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

  const xTickValues = useMemo(() => data.map((_, i) => i + 0.5), [data]);
  const yTickValues = useMemo(() => data[0].rows.map((_, i) => i + 0.5), [data]);

  useImperativeHandle(ref, () => ({
    downloadSVG: () => {
      if (svgRef.current) downloadAsSVG(svgRef.current, downloadFileName ?? "heatmap.svg");
    },
    downloadPNG: () => {
      if (svgRef.current) downloadSVGAsPNG(svgRef.current, downloadFileName ?? "heatmap.png");
    },
  }));

  return (
    <ResponsiveContainer parentRef={parentRef} containerStyle={containerStyle}>
      {/* Prevent undefined parent size from causing creation of elements with negative dimensions */}
      {!parentWidth || !parentHeight ? null : (
        <svg width={parentWidth} height={parentHeight} ref={svgRef}>
          <g transform={`translate(${marg.left},${marg.top})`}>
            <HeatmapCells
              data={data}
              xScale={xScale}
              yScale={yScale}
              colors={colors}
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
              top={yMax + binHeight}
              scale={xScale}
              numTicks={data.length}
              tickFormat={(d) => allColNames[Math.floor(+d)] ?? ""}
              tickValues={xTickValues}
              tickLabelProps={() => ({
                fontSize: 12,
                fontFamily: "sans-serif",
                textAnchor: xTickTextAnchor,
                angle: xTickAngle,
                dy: xLabelOrientation === "horizontal" ? "0.71em" : "0.25em",
              })}
              label={xLabel ?? ""}
              labelOffset={colLabelHeight + AXIS_LABEL_GAP}
              labelProps={{
                fontSize: 14,
                fontFamily: "sans-serif",
                textAnchor: "middle",
                dy: "-0.5em",
              }}
            />
            <AxisLeft
              top={binHeight}
              scale={yScale}
              numTicks={numRows}
              tickValues={yTickValues}
              tickFormat={(d) => allRowNames[Math.floor(+d)] ?? ""}
              tickLabelProps={() => ({
                fontSize: 12,
                fontFamily: "sans-serif",
                textAnchor: "end",
                dx: "-0.25em",
                dy: "0.25em",
              })}
              label={yLabel ?? ""}
              labelOffset={maxRowNameLength * 8 + AXIS_LABEL_GAP}
              labelProps={{
                fontSize: 14,
                fontFamily: "sans-serif",
                textAnchor: "middle",
              }}
            />
            {showLegend && (
              <g transform={`translate(${xMax + LEGEND_GAP}, ${binHeight})`}>
                <HeatmapLegend
                  colors={colors}
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
