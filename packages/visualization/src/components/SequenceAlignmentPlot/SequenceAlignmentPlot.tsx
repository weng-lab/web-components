import React, { useRef, useEffect, useState, useMemo, useCallback, ReactNode } from "react";
import { AxisBottom } from "@visx/axis";
import { scaleLinear } from "@visx/scale";
import { defaultStyles,  useTooltip, useTooltipInPortal } from "@visx/tooltip";
import { Group } from "@visx/group";

export type Nucleotide = "A" | "C" | "G" | "T" | "-";

const NUCLEOTIDE_COLORS: Record<Nucleotide, string> = {
  A: "#228b22", // green
  C: "blue", // blue
  G: "orange", // orange
  T: "red", // red
  "-": "white", // missing
};

export interface SequenceAlignmentPlotProps {
  data: { [id: string]: Nucleotide[] };
  getLabel: (id: string) => string;
  getOrderColor: (id: string) => string;
  /**
   * the evolutionary order, not sort order. Sort in plot by sorting input data
   */
  getOrder: (id: string) => string;
  width: number;
  height: number;
  /**
   * If not empty, lowers opacity of rest of species to 0.3
   */
  highlighted?: string[];
  /**
   * Optionally define tooltip for hover over leaf nodes
   */
  tooltipContents?: (tooltipData: TooltipData) => ReactNode;
}

const AXIS_HEIGHT = 30;
const SPECIES_BAR_AXIS_WIDTH = 15
const SPECIES_BAR_WIDTH = 50;
const GAP_BETWEEN = 30;
const CANVAS_LEFT_OFFSET = SPECIES_BAR_AXIS_WIDTH + SPECIES_BAR_WIDTH + GAP_BETWEEN


export type SpeciesInfo = {id: string, label: string, order: string, color: string}

export type TooltipData = SpeciesInfo & {
      basePair?: Nucleotide;
      position?: number;
    }

/**
 * @todo This component could use some cleanup and maybe manual memoization to handle hover changes to highlight more efficiently
 */
export const SequenceAlignmentPlot: React.FC<SequenceAlignmentPlotProps> = ({
  data,
  width: totalWidth,
  height: totalHeight,
  getLabel,
  getOrderColor,
  getOrder,
  highlighted = [],
  tooltipContents
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } = useTooltip<TooltipData >();

    const { TooltipInPortal } = useTooltipInPortal({
      scroll: true,
      detectBounds: true,
    });

  const numSpecies = Object.keys(data).length;
  const numPositions = Object.values(data)[0].length ?? 0;

  const canvasWidth = totalWidth - CANVAS_LEFT_OFFSET
  const canvasHeight = totalHeight - AXIS_HEIGHT

  const speciesInfo = useMemo(() =>{
    const entries: [string, SpeciesInfo][] = Object.keys(data).map((species) => [
      species,
      { id: species, label: getLabel(species), order: getOrder(species), color: getOrderColor(species) },
    ]);
    return new Map<string, SpeciesInfo>(entries)
  }, [data])

  console.log(tooltipData)

  // const shouldLowerOpacity = useCallback((id: string) => {
  //   highlighted.length && !highlighted.includes(species) ? 0.3 : 1
  // }, [Highlight])

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // Bitmap matches CSS size (scaled for DPR)
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;

    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    // Clear + reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Map data space → bitmap space
    const scaleX = canvas.width / numPositions;
    const scaleY = canvas.height / numSpecies;

    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

    // Draw all data
    Object.entries(data).forEach(([species, sequence], y) => {
      sequence.forEach((nucleotide, x) => {
        ctx.fillStyle = NUCLEOTIDE_COLORS[nucleotide];
        ctx.globalAlpha = highlighted.length && !highlighted.includes(species) ? 0.3 : 1
        ctx.fillRect(x, y, 1, 1);
        ctx.globalAlpha = 1
      });
    });
  }, [data, canvasWidth, canvasHeight, numPositions, numSpecies]);

  // Hover mapping
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const left = e.clientX
    const top = e.clientY
    const position = Math.floor(((e.clientX - rect.left) / rect.width) * numPositions);
    const speciesIndex = Math.floor(((e.clientY - rect.top) / rect.height) * numSpecies);
    const species = Object.keys(data)[speciesIndex]
    const basePair = data[species][position]

    if (position >= 0 && position < numPositions && speciesIndex >= 0 && speciesIndex < numSpecies) {
      showTooltip({
        tooltipTop: top,
        tooltipLeft: left,
        tooltipData: { position, basePair, ...(speciesInfo.get(species) as SpeciesInfo) },
      });
    } else {
      hideTooltip();
    }
  };

  const xScale = scaleLinear({
    domain: [0, numPositions - 1],
    range: [0, canvasWidth],
  });

  const speciesList = [...speciesInfo.values()]

  return (
    <div
      style={{
        position: "relative",
        width: totalWidth,
        height: totalHeight,
      }}
    >
      <svg
        width={SPECIES_BAR_WIDTH}
        height={canvasHeight}
        style={{ top: 0, left: SPECIES_BAR_AXIS_WIDTH, position: "absolute" }}
      >
        <Group left={SPECIES_BAR_AXIS_WIDTH}>
          {speciesList.map((species, i) => {
            const rectHeight = canvasHeight / speciesList.length;
            return (
              <rect
                key={i}
                onMouseMove={(event) =>
                  showTooltip({ tooltipLeft: event.clientX, tooltipTop: event.clientY, tooltipData: species })
                }
                onMouseLeave={hideTooltip}
                width={SPECIES_BAR_WIDTH}
                height={rectHeight}
                x={0}
                y={rectHeight * i}
                fill={species.color}
                shapeRendering={"crispEdges"}
                opacity={highlighted.length && !highlighted.includes(species.id) ? 0.3 : 1}
              />
            );
          })}
        </Group>
        <text
          y={canvasHeight / 2}
          x={6}
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "center",
            transformBox: "fill-box",
          }}
          textAnchor="middle"
          fontSize={12}
        >
          Order
        </text>
      </svg>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={hideTooltip}
        style={{ position: "absolute", left: CANVAS_LEFT_OFFSET }}
      />
      {/* Bottom axis */}
      <svg
        width={canvasWidth}
        height={AXIS_HEIGHT}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          overflow: "visible",
        }}
      >
        <AxisBottom
          scale={xScale}
          label={
            "Position\u00A0\u00A0\u00A0•\u00A0\u00A0\u00A0🟢\u00A0A\u00A0\u00A0\u00A0🔵\u00A0C\u00A0\u00A0\u00A0🟠\u00A0G\u00A0\u00A0\u00A0🔴\u00A0T"
          }
          labelProps={{ fontSize: 12 }}
        />
      </svg>
      {tooltipData && tooltipContents && (
        <TooltipInPortal left={tooltipLeft} top={tooltipTop} style={defaultStyles}>
         {tooltipContents(tooltipData)}
        </TooltipInPortal>
      )}
    </div>
  );
};
