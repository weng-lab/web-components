import { HeatmapRect, HeatmapCircle } from "@visx/heatmap";
import { scaleLinear } from "@visx/scale";
import type { HeatmapProps, RowDatum, ColumnDatum } from "./types";
import { useParentSize } from "@visx/responsive";
import { useState, useImperativeHandle, useRef, ReactNode, useCallback } from "react";
import { downloadAsSVG, downloadSVGAsPNG } from "../../utility";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { Portal, TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { RectCell } from "@visx/heatmap/lib/heatmaps/HeatmapRect";
import { CircleCell } from "@visx/heatmap/lib/heatmaps/HeatmapCircle";

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
}: HeatmapProps) => {
  const { parentRef, width: parentWidth, height: parentHeight } = useParentSize();
  const [hoveredCell, setHoveredCell] = useState<{ row: number; column: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } = useTooltip<ReactNode>();

  const handleMouseMove = (bin: RectCell<ColumnDatum, RowDatum> | CircleCell<ColumnDatum, RowDatum>) =>
    useCallback(
      (event: React.MouseEvent<SVGElement>) => {
        if (!tooltipBody) return;

        const tooltipContent = tooltipBody(bin);

        showTooltip({
          tooltipLeft: event.pageX + 10,
          tooltipTop: event.pageY + 10,
          tooltipData: tooltipContent,
        });
      },
      [tooltipBody, data, showTooltip]
    );

  function max<Datum>(data: Datum[], value: (d: Datum) => number): number {
    return Math.max(...data.map(value));
  }
  function min<Datum>(data: Datum[], value: (d: Datum) => number): number {
    return Math.min(...data.map(value));
  }

  // accessors
  const rows = (d: ColumnDatum) => d.rows;
  const count = (d: RowDatum) => d.count;

  const allColNames: string[] = data.reduce((acc: string[], curr: ColumnDatum) => {
    acc.push(curr.columnName);
    return acc;
  }, []);
  const allRowNames: string[] = data[0].rows.reduce((acc: string[], curr: RowDatum) => {
    acc.push(curr.rowName);
    return acc;
  }, []);

  const maxValue = max(data, (d) => max(rows(d), count));
  const numRows = max(data, (d) => rows(d).length);

  const xScale = scaleLinear<number>({
    domain: [0, data.length],
  });

  const yScale = scaleLinear<number>({
    domain: [0, numRows],
  });

  const colorScale = scaleLinear<string>({
    range: colors,
    domain: colors.map((_, i) => (i * maxValue) / (colors.length - 1)),
  });

  const opacityScale = scaleLinear<number>({
    range: [0.5, 1],
    domain: [0.5, maxValue],
  });

  const maxColNameLength = allColNames.reduce((max, name) => Math.max(max, name.length), 0);
  const maxRowNameLength = allRowNames.reduce((max, name) => Math.max(max, name.length), 0);

  // bounds for display
  // the constants for the left and bottom margins really only work for font size of 12 to fit the axis labels in the svg....so maybe need to think of a more dynamic solution
  const marg = margin ?? { top: 20, left: maxRowNameLength * 8 + 40, right: 10, bottom: maxColNameLength * 8 + 70 };

  const xMax = parentWidth > marg.left + marg.right ? parentWidth - marg.left - marg.right : parentWidth;
  const yMax = parentHeight - marg.bottom - marg.top;

  const binWidth = xMax / data.length;
  const binHeight = yMax / numRows;
  const radius = min([binWidth, binHeight], (d) => d) / 2;

  xScale.range([0, xMax]);
  yScale.range([yMax, 0]);

  const xTickValues = data.map((_, i) => i + 0.5);
  const yTickValues = data[0].rows.map((_, i) => i + 0.5);

  // downloading plot
  useImperativeHandle(ref, () => ({
    downloadSVG: () => {
      if (svgRef.current) downloadAsSVG(svgRef.current, downloadFileName ?? "heatmap.svg");
    },
    downloadPNG: () => {
      if (svgRef.current) downloadSVGAsPNG(svgRef.current, downloadFileName ?? "heatmap.png");
    },
  }));

  const commonHeatmapProps = {
    data,
    xScale: (d: number) => xScale(d),
    yScale: (d: number) => yScale(d),
    colorScale,
    opacityScale,
    bins: rows,
    gap,
  };

  const HeatmapComponent = isRect ? HeatmapRect : HeatmapCircle;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }} ref={parentRef}>
      {/* Prevent undefined parent size from causing creation of elements with negatvie dimensions */}
      {!parentWidth || !parentHeight ? null : (
        <svg width={parentWidth} height={parentHeight} ref={svgRef}>
          <g transform={`translate(${marg.left},${marg.top})`}>
            <HeatmapComponent {...commonHeatmapProps} {...(isRect ? { binWidth, binHeight } : { radius })}>
              {(heatmap) =>
                heatmap.map((heatmapBins) =>
                  heatmapBins.map((bin) => {
                    const key = `heatmap-group-${bin.row}-${bin.column}`;
                    const sharedProps = {
                      fill: bin.color,
                      fillOpacity: bin.opacity,
                      stroke: hoveredCell?.row === bin.row && hoveredCell?.column === bin.column ? bin.color : "none",
                      strokeWidth: hoveredCell?.row === bin.row && hoveredCell?.column === bin.column ? 2 : 0,
                      style: { cursor: "pointer" },
                    };
                    // Type guards for rect/circle properties
                    const isRectCell = isRect && "width" in bin && "height" in bin && "x" in bin && "y" in bin;
                    const isCircleCell = !isRect && "cy" in bin && "r" in bin;
                    return (
                      <g
                        key={key}
                        onMouseEnter={() => setHoveredCell({ row: bin.row, column: bin.column })}
                        onMouseLeave={() => {
                          setHoveredCell(null);
                          hideTooltip?.();
                        }}
                        onMouseMove={handleMouseMove(bin)}
                        onClick={() => {
                          if (typeof onClick === "function") {
                            onClick(bin);
                          }
                        }}
                        style={{ cursor: "pointer", transition: "stroke-width 0.2s" }}
                      >
                        {isRectCell ? (
                          <rect
                            className="visx-heatmap-rect"
                            width={bin.width}
                            height={bin.height}
                            x={bin.x}
                            y={bin.y}
                            {...sharedProps}
                          />
                        ) : isCircleCell ? (
                          <circle
                            className="visx-heatmap-circle"
                            cx={bin.column * binWidth + binWidth / 2}
                            cy={bin.cy}
                            r={bin.r}
                            {...sharedProps}
                          />
                        ) : null}
                      </g>
                    );
                  })
                )
              }
            </HeatmapComponent>
            <AxisBottom
              top={yMax + binHeight}
              scale={xScale}
              numTicks={data.length}
              tickFormat={(d) => allColNames[Math.floor(+d)] ?? ""}
              tickValues={xTickValues}
              stroke="#4d4f52"
              tickStroke="#4d4f52"
              tickLabelProps={() => ({
                fontSize: 12,
                fill: "#4d4f52",
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
              stroke="#4d4f52"
              tickStroke="#4d4f52"
              tickLabelProps={() => ({
                fontSize: 12,
                fill: "#4d4f52",
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
          </g>
          {tooltipBody && tooltipOpen && tooltipData && (
            <Portal>
              <TooltipWithBounds left={tooltipLeft} top={tooltipTop}>
                {tooltipData}
              </TooltipWithBounds>
            </Portal>
          )}
        </svg>
      )}
    </div>
  );
};

export default Heatmap;
