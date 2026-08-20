import { memo, useState, ReactElement, MouseEvent } from "react";
import { Portal, TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { motion } from "framer-motion";
import { getAnimationProps } from "../../utility";
import type { AnimationType } from "../../utility";
import type { AnyBin } from "./HeatmapCells";

const CELL_STYLE = { cursor: "pointer" };
const WRAPPER_STYLE = { cursor: "pointer", transition: "stroke-width 0.2s" };

export interface HeatmapCellProps {
  bin: AnyBin;
  isRect: boolean;
  binWidth: number;
  fill: string;
  fillOpacity: number;
  colIndex: number;
  animationType?: AnimationType;
  tooltipBody?: (bin: AnyBin) => ReactElement;
  onClick?: (bin: AnyBin) => void;
}

// Tooltip/hover state is local to each cell (rather than shared across the whole grid in the
// parent) so hovering one cell only re-renders that cell, not every cell in the heatmap.
const HeatmapCell = memo(function HeatmapCell({
  bin, isRect, binWidth, fill, fillOpacity, colIndex,
  animationType, tooltipBody, onClick,
}: HeatmapCellProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } = useTooltip<ReactElement>();

  const isRectCell = isRect && "width" in bin && "height" in bin && "x" in bin && "y" in bin;
  const isCircleCell = !isRect && "cy" in bin && "r" in bin;

  const sharedProps = {
    fill,
    fillOpacity,
    stroke: isHovered ? fill : "none",
    strokeWidth: isHovered ? 2 : 0,
    style: CELL_STYLE,
  };

  const Wrapper = animationType ? motion.g : "g";
  const animProps = getAnimationProps(animationType as AnimationType, colIndex);

  return (
    <>
      <Wrapper
        {...animProps}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
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
        style={WRAPPER_STYLE}
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

export default HeatmapCell;
