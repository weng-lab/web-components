import { HeatmapRect, HeatmapCircle, RectCell, CircleCell } from "@visx/heatmap";
import { scaleLinear } from "@visx/scale";
import { useMemo, useRef, memo, ReactElement } from "react";
import type { AnimationType } from "../../utility";
import type { ColumnDatum, RowDatum, HeatmapCellId } from "./types";
import HeatmapCell from "./HeatmapCell";
import { PlotTooltip, type PlotTooltipHandle } from "../../tooltip";
import { useStableCallback } from "../../hooks";

export type AnyBin = RectCell<ColumnDatum, RowDatum> | CircleCell<ColumnDatum, RowDatum>;

const getBins = (d: ColumnDatum) => d.rows;

const DEFAULT_DESELECTED_COLOR = "#d1d5db";
const DESELECTED_OPACITY = 0.5;

const cellKey = (cell: HeatmapCellId) => `${cell.row}-${cell.column}`;

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
  selectedCells?: HeatmapCellId[];
  deselectedColor?: string;
}

const HeatmapCells = memo(function HeatmapCells({
  data, xScale, yScale, colors, maxValue, gap,
  isRect, binWidth, binHeight, animationType,
  tooltipBody, onClick, selectedCells, deselectedColor = DEFAULT_DESELECTED_COLOR,
}: HeatmapCellsProps) {
  const colorScale = useMemo(
    () => scaleLinear<string>({ range: colors, domain: colors.map((_, i) => (i * maxValue) / (colors.length - 1)) }),
    [colors, maxValue]
  );
  const opacityScale = useMemo(
    () => scaleLinear<number>({ range: [0.5, 1], domain: [0.5, maxValue] }),
    [maxValue]
  );
  const radius = Math.min(binWidth, binHeight) / 2;

  const selectedKeys = useMemo(
    () => (selectedCells?.length ? new Set(selectedCells.map(cellKey)) : null),
    [selectedCells]
  );

  // The tooltip is a sibling of the grid and owns its own state, so moving the pointer around
  // never re-renders a cell. Cells reach it through this ref, which never changes identity.
  const tooltipRef = useRef<PlotTooltipHandle<AnyBin>>(null);

  // Consumers commonly pass an inline arrow for onClick. Cells are memoized on prop identity,
  // so forwarding that directly would invalidate every cell on each render of the consumer.
  const handleClick = useStableCallback(onClick);

  const HeatmapComponent = isRect ? HeatmapRect : HeatmapCircle;

  return (
    <>
      <HeatmapComponent
        data={data}
        xScale={xScale}
        yScale={yScale}
        colorScale={colorScale}
        opacityScale={opacityScale}
        bins={getBins}
        gap={gap}
        {...(isRect ? { binWidth, binHeight } : { radius })}
      >
        {(heatmap) =>
          heatmap.map((heatmapBins, colIndex) =>
            heatmapBins.map((bin) => {
              const isDeselected = !!selectedKeys && !selectedKeys.has(cellKey(bin));
              return (
                <HeatmapCell
                  key={`heatmap-cell-${bin.row}-${bin.column}`}
                  bin={bin}
                  isRect={isRect}
                  binWidth={binWidth}
                  fill={isDeselected ? deselectedColor : bin.color ?? deselectedColor}
                  fillOpacity={isDeselected ? DESELECTED_OPACITY : bin.opacity ?? 1}
                  colIndex={colIndex}
                  animationType={animationType}
                  tooltipRef={tooltipRef}
                  onClick={handleClick}
                />
              );
            })
          )
        }
      </HeatmapComponent>
      {tooltipBody && <PlotTooltip ref={tooltipRef}>{tooltipBody}</PlotTooltip>}
    </>
  );
});

export default HeatmapCells;
