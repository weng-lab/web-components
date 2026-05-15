import { scaleLinear } from "@visx/scale";
import type { HeatmapProps, ColumnDatum } from "./types";
import { useParentSize } from "@visx/responsive";
import { useImperativeHandle, useRef, useMemo } from "react";
import { downloadAsSVG, downloadSVGAsPNG } from "../../utility";
import { AxisLeft, AxisBottom } from "@visx/axis";
import HeatmapCells from "./HeatmapCells";
import HeatmapLegend from "./HeatmapLegend";

const LEGEND_WIDTH = 70;
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
}: HeatmapProps) => {
  const { parentRef, width: parentWidth, height: parentHeight } = useParentSize();
  const svgRef = useRef<SVGSVGElement | null>(null);

  const allColNames = useMemo(() => data.map((d) => d.columnName), [data]);
  const allRowNames = useMemo(() => data[0].rows.map((r) => r.rowName), [data]);
  const maxValue = useMemo(() => maxOf(data, (d) => maxOf(getBins(d), (r) => r.count)), [data]);
  const numRows = useMemo(() => maxOf(data, (d) => getBins(d).length), [data]);

  const maxColNameLength = allColNames.reduce((m, name) => Math.max(m, name.length), 0);
  const maxRowNameLength = allRowNames.reduce((m, name) => Math.max(m, name.length), 0);

  const defaultRight = showLegend ? LEGEND_WIDTH : 10;
  const defaultTop = 20;
  // Solve for bottom margin so that (bottom - binHeight) always equals the space needed for
  // rotated column labels. binHeight = (parentHeight - top - bottom) / numRows, so:
  // bottom = (labelSpace * numRows + parentHeight - top) / (numRows + 1)
  const labelBottomSpace = maxColNameLength * 8 + 70;
  const marg = margin ?? {
    top: defaultTop,
    left: maxRowNameLength * 8 + 40,
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
    <div style={{ position: "relative", width: "100%", height: "100%" }} ref={parentRef}>
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
                textAnchor: "end",
                angle: -90,
                dy: "0.25em",
              })}
              label={xLabel ?? ""}
              labelOffset={maxColNameLength * 8}
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
              labelOffset={maxRowNameLength * 8}
              labelProps={{
                fontSize: 14,
                fontFamily: "sans-serif",
                textAnchor: "middle",
              }}
            />
            {showLegend && (
              <g transform={`translate(${xMax + 16}, ${binHeight})`}>
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
    </div>
  );
};

export default Heatmap;
