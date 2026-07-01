import { useMemo, useRef, useImperativeHandle, useState } from "react";
import { scaleBand, scaleLinear } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { Text } from "@visx/text";
import { useParentSize } from "@visx/responsive";
import {
  useTooltip,
  TooltipWithBounds,
  Portal,
  defaultStyles as defaultTooltipStyles,
} from "@visx/tooltip";
import { downloadAsSVG, downloadSVGAsPNG } from "../../utility";
import { DotPlotData, DotPlotProps } from "./types";

function split(left: number, right: number, parts: number): number[] {
  const result: number[] = [];
  const delta = (right - left) / (parts - 1);
  let cur = left;
  while (cur < right) {
    result.push(cur);
    cur += delta;
  }
  result.push(right);
  return result;
}

function extentOf(values: number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  return [min, max === min ? (max === 0 ? 1 : max * 2) : max];
}

const DotPlot = ({
  data,
  showTooltipData,
  deg,
  xTickFontStyle = "normal",
  radiusTitle = "Percent Expressed",
  colorTitle = "Mean Expression",
  ref,
  downloadFileName,
}: DotPlotProps) => {
  const { parentRef, width: parentWidth, height: parentHeight } = useParentSize();
  const svgRef = useRef<SVGSVGElement | null>(null);

  useImperativeHandle(ref, () => ({
    downloadSVG: () => {
      if (svgRef.current) downloadAsSVG(svgRef.current, downloadFileName ?? "dot_plot.svg");
    },
    downloadPNG: () => {
      if (svgRef.current) downloadSVGAsPNG(svgRef.current, downloadFileName ?? "dot_plot.png");
    },
  }));

  const xCategories = useMemo(
    () => [...new Set(data.map((d) => d.x))].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
    [data]
  );
  const yCategories = useMemo(() => [...new Set(data.map((d) => d.y))], [data]);

  const radiusDomain = useMemo(() => extentOf(data.map((d) => d.radius)), [data]);
  const colorDomain = useMemo(() => extentOf(data.map((d) => d.color)), [data]);

  const maxXLabelLen = Math.max(...xCategories.map((k) => k.length), 1);
  const maxYLabelLen = Math.max(...yCategories.map((d) => d.length), 1);

  const xAxisLabelSpace = maxXLabelLen * 7 + 20;
  const legendItemSpacing = 22;
  const legendTitleHeight = 18;
  const legendAreaHeight = legendTitleHeight + 4 * legendItemSpacing + 12;

  const margin = {
    top: 20,
    right: 20,
    bottom: xAxisLabelSpace + legendAreaHeight + 16,
    left: maxYLabelLen * 7 + 20,
  };

  const innerWidth = Math.max(0, parentWidth - margin.left - margin.right);

  const dotCellHeight = 48;
  const computedHeight = yCategories.length * dotCellHeight + margin.top + margin.bottom;
  const svgHeight = parentHeight > 0 ? parentHeight : computedHeight;
  const innerHeight = Math.max(0, svgHeight - margin.top - margin.bottom);

  const xScale = useMemo(
    () => scaleBand({ domain: xCategories, range: [0, innerWidth], padding: 0.3 }),
    [xCategories, innerWidth]
  );
  const yScale = useMemo(
    () => scaleBand({ domain: yCategories, range: [0, innerHeight], padding: 0.3 }),
    [yCategories, innerHeight]
  );

  const maxRadius = Math.max(2, Math.min(xScale.bandwidth(), yScale.bandwidth()) / 2);

  const radiusScale = useMemo(
    () => scaleLinear({ domain: radiusDomain, range: [maxRadius * 0.15, maxRadius] }),
    [radiusDomain, maxRadius]
  );

  const blueScale = useMemo(
    () => scaleLinear({ domain: [0, colorDomain[1]], range: [191, 0] }),
    [colorDomain]
  );
  const negScale = useMemo(
    () => scaleLinear({ domain: [colorDomain[0], 0], range: [0, 191] }),
    [colorDomain]
  );

  const getDotColor = (v: number): string => {
    const clamp = (n: number) => Math.round(Math.max(0, Math.min(255, n)));
    if (!deg) {
      const c = clamp(blueScale(v));
      return `rgb(${c},${c},255)`;
    }
    if (v === 0) return "rgb(232,223,221)";
    if (v > 0) {
      const c = clamp(blueScale(v));
      return `rgb(${c},${c},255)`;
    }
    const c = clamp(negScale(v));
    return `rgb(255,${c},${c})`;
  };

  const radiusLegendValues = useMemo(() => {
    const diff = (radiusDomain[1] - radiusDomain[0]) / 3;
    return [0, 1, 2, 3].map((i) => radiusDomain[0] + diff * i);
  }, [radiusDomain]);

  const colorLegendValues = useMemo(() => split(colorDomain[0], colorDomain[1], 4), [colorDomain]);

  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<DotPlotData>();

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!parentWidth) {
    return <div ref={parentRef} style={{ width: "100%", height: "100%" }} />;
  }

  return (
    <div ref={parentRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      <svg ref={svgRef} width={parentWidth} height={svgHeight}>
        <Group top={margin.top} left={margin.left}>
          {data.map((d, idx) => {
            const cx = (xScale(d.x) ?? 0) + xScale.bandwidth() / 2;
            const cy = (yScale(d.y) ?? 0) + yScale.bandwidth() / 2;
            const hovered = hoveredIdx === idx;
            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={radiusScale(d.radius)}
                fill={getDotColor(d.color)}
                stroke={hovered || d.highlighted ? "#000000" : "none"}
                strokeWidth={hovered ? 2 : d.highlighted ? 2 : 0}
                style={{ cursor: "default" }}
                onMouseEnter={(e) => {
                  setHoveredIdx(idx);
                  showTooltip({ tooltipLeft: e.clientX, tooltipTop: e.clientY, tooltipData: d });
                }}
                onMouseLeave={() => {
                  setHoveredIdx(null);
                  hideTooltip();
                }}
              />
            );
          })}

          <AxisBottom
            top={innerHeight}
            scale={xScale}
            tickLabelProps={() => ({
              fontSize: 11,
              textAnchor: "end",
              angle: -90,
              dx: "0.25em",
              dy: "0.25em",
              fontStyle: xTickFontStyle,
            })}
            hideTicks
            hideAxisLine
          />

          <AxisLeft
            scale={yScale}
            tickLabelProps={() => ({
              fontSize: 11,
              textAnchor: "end",
              dx: "-0.25em",
              dy: "0.25em",
            })}
            hideTicks
            hideAxisLine
          />

          {/* Legends below the plot, spaced evenly */}
          {(() => {
            const legendsTop = innerHeight + xAxisLabelSpace + 36;
            // space-evenly: gap = (innerWidth - totalLegendsWidth) / 3
            const radiusLegendWidth = 110;
            const colorLegendWidth = 100;
            const gap = Math.max(20, (innerWidth - radiusLegendWidth - colorLegendWidth) / 3);
            const radiusLegendX = gap;
            const colorLegendX = gap + radiusLegendWidth + gap;
            return (
              <>
                {/* Radius (percent expressed) legend */}
                <Group left={radiusLegendX} top={legendsTop}>
                  <Text x={0} y={0} fontSize={11} fontWeight="bold">
                    {radiusTitle}
                  </Text>
                  {radiusLegendValues.map((r, i) => (
                    <Group key={i} top={legendTitleHeight + i * legendItemSpacing}>
                      <circle r={radiusScale(r)} cx={maxRadius} cy={0} fill="#000000" />
                      <Text x={maxRadius * 2 + 6} y={0} fontSize={10} verticalAnchor="middle">
                        {r.toFixed(2)}
                      </Text>
                    </Group>
                  ))}
                </Group>

                {/* Color (mean expression) legend */}
                <Group left={colorLegendX} top={legendsTop}>
                  <Text x={0} y={0} fontSize={11} fontWeight="bold">
                    {colorTitle}
                  </Text>
                  {colorLegendValues.map((v, i) => (
                    <Group key={i} top={legendTitleHeight + i * legendItemSpacing}>
                      <rect width={14} height={14} x={0} y={-7} fill={getDotColor(v)} />
                      <Text x={18} y={0} fontSize={10} verticalAnchor="middle">
                        {v.toFixed(2)}
                      </Text>
                    </Group>
                  ))}
                </Group>
              </>
            );
          })()}
        </Group>
      </svg>

      {tooltipOpen && tooltipData && (
        <Portal>
          <TooltipWithBounds
            top={tooltipTop}
            left={tooltipLeft}
            style={{ ...defaultTooltipStyles, backgroundColor: "#283238", color: "white" }}
          >
            {!showTooltipData ? (
              <>
                <p style={{ margin: 0 }}>Percent Expressed: {tooltipData.radius.toFixed(2)}</p>
                <p style={{ margin: 0 }}>Mean Expression: {tooltipData.color.toFixed(2)}</p>
              </>
            ) : (
              <>
                <p style={{ margin: 0 }}>
                  -log<sub>10</sub>(<i>P</i>
                  <sub>adj</sub>): {tooltipData.radius.toFixed(2)}
                </p>
                <p style={{ margin: 0 }}>
                  log<sub>2</sub>(fold change): {tooltipData.color.toFixed(2)}
                </p>
              </>
            )}
            <p style={{ margin: 0 }}>{tooltipData.x}</p>
          </TooltipWithBounds>
        </Portal>
      )}
    </div>
  );
};

export default DotPlot;
