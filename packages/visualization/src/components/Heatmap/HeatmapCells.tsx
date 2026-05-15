import { HeatmapRect, HeatmapCircle } from "@visx/heatmap";
import { scaleLinear } from "@visx/scale";
import { useState, useMemo, memo, ReactNode, ReactElement, MouseEvent } from "react";
import { Portal, TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { RectCell } from "@visx/heatmap/lib/heatmaps/HeatmapRect";
import { CircleCell } from "@visx/heatmap/lib/heatmaps/HeatmapCircle";
import { motion } from "framer-motion";
import { getAnimationProps } from "../../utility";
import type { AnimationType } from "../../utility";
import type { ColumnDatum, RowDatum } from "./types";

export type AnyBin = RectCell<ColumnDatum, RowDatum> | CircleCell<ColumnDatum, RowDatum>;

const getBins = (d: ColumnDatum) => d.rows;

export interface HeatmapCellsProps {
  data: ColumnDatum[];
  xScale: (d: number) => number;
  yScale: (d: number) => number;
  colors: [string, string, ...string[]];
  maxValue: number;
  gap: number;
  isRect: boolean;
  binWidth: number;
  binHeight: number;
  animationType?: AnimationType;
  tooltipBody?: (bin: AnyBin) => ReactElement;
  onClick?: (bin: AnyBin) => void;
}

const HeatmapCells = memo(function HeatmapCells({
  data, xScale, yScale, colors, maxValue, gap,
  isRect, binWidth, binHeight, animationType,
  tooltipBody, onClick,
}: HeatmapCellsProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; column: number } | null>(null);
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } = useTooltip<ReactNode>();

  const colorScale = useMemo(
    () => scaleLinear<string>({ range: colors, domain: colors.map((_, i) => (i * maxValue) / (colors.length - 1)) }),
    [colors, maxValue]
  );
  const opacityScale = useMemo(
    () => scaleLinear<number>({ range: [0.5, 1], domain: [0.5, maxValue] }),
    [maxValue]
  );
  const radius = Math.min(binWidth, binHeight) / 2;

  const HeatmapComponent = isRect ? HeatmapRect : HeatmapCircle;

  return (
    <>
      <HeatmapComponent
        data={data}
        xScale={(d: number) => xScale(d)}
        yScale={(d: number) => yScale(d)}
        colorScale={colorScale}
        opacityScale={opacityScale}
        bins={getBins}
        gap={gap}
        {...(isRect ? { binWidth, binHeight } : { radius })}
      >
        {(heatmap) =>
          heatmap.map((heatmapBins, colIndex) =>
            heatmapBins.map((bin) => {
              const key = `heatmap-group-${bin.row}-${bin.column}`;
              const isHovered = hoveredCell?.row === bin.row && hoveredCell?.column === bin.column;
              const sharedProps = {
                fill: bin.color,
                fillOpacity: bin.opacity,
                stroke: isHovered ? bin.color : "none",
                strokeWidth: isHovered ? 2 : 0,
                style: { cursor: "pointer" },
              };
              const isRectCell = isRect && "width" in bin && "height" in bin && "x" in bin && "y" in bin;
              const isCircleCell = !isRect && "cy" in bin && "r" in bin;
              const Wrapper = animationType ? motion.g : "g";
              const animProps = getAnimationProps(animationType as AnimationType, colIndex);
              return (
                <Wrapper
                  key={key}
                  {...animProps}
                  onMouseEnter={() => setHoveredCell({ row: bin.row, column: bin.column })}
                  onMouseLeave={() => {
                    setHoveredCell(null);
                    hideTooltip();
                  }}
                  onMouseMove={(event: MouseEvent<SVGElement>) => {
                    if (!tooltipBody) return;
                    showTooltip({
                      tooltipLeft: event.pageX + 10,
                      tooltipTop: event.pageY + 10,
                      tooltipData: tooltipBody(bin),
                    });
                  }}
                  onClick={() => onClick?.(bin)}
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
                </Wrapper>
              );
            })
          )
        }
      </HeatmapComponent>
      {tooltipBody && tooltipOpen && tooltipData && (
        <Portal>
          <TooltipWithBounds left={tooltipLeft} top={tooltipTop}>
            {tooltipData}
          </TooltipWithBounds>
        </Portal>
      )}
    </>
  );
});

export default HeatmapCells;
