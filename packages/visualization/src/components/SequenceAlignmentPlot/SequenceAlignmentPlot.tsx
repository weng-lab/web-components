import React, { useRef, useEffect, useState, useMemo, useCallback, ReactNode } from "react";
import { AxisBottom } from "@visx/axis";
import { scaleLinear } from "@visx/scale";
import { defaultStyles, useTooltip, useTooltipInPortal } from "@visx/tooltip";
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
   * Used to sync plot state with hover on PhyloTree. Plot treats these as if they are internally hovered
   */
  hovered?: string[];
  /**
   * Fired when internal hover state changes
   */
  onHoverChange?: (hovered: string | null) => void;
  /**
   * Places indicator next to species
   */
  highlighted?: string[]
  /**
   * Optionally define tooltip for hover over leaf nodes
   */
  tooltipContents?: (tooltipData: TooltipData) => ReactNode;
}

const AXIS_HEIGHT = 30;
const SPECIES_BAR_WIDTH = 30;
const HIGHLIGHTED_BAR_WIDTH = 10;
const PADDING = 10
const SVG_WIDTH = HIGHLIGHTED_BAR_WIDTH + PADDING + SPECIES_BAR_WIDTH + PADDING;

export type SpeciesInfo = { id: string; label: string; order: string; color: string };

export type TooltipData = SpeciesInfo & {
  basePair?: Nucleotide;
  position?: number;
};

/**
 * @todo This component could use some cleanup and maybe manual memoization to handle hover changes to highlight more efficiently
 * Maybe try debouncing the hover changes using requestAnimationFrame like PhyloTree
 */
export const SequenceAlignmentPlot: React.FC<SequenceAlignmentPlotProps> = ({
  data,
  width: totalWidth,
  height: totalHeight,
  getLabel,
  getOrderColor,
  getOrder,
  hovered: externalHovered = [],
  highlighted = [],
  onHoverChange = () => null,
  tooltipContents,
}) => {
  const [internalHovered, setInternalHovered] = useState<string | null>(null);

  const handleSetInternalHover = useCallback(
    (newHovered: string | null) => {
      const changed = newHovered !== internalHovered;

      if (changed) {
        setInternalHovered(newHovered);
        onHoverChange(newHovered);
      }
    },
    [internalHovered, onHoverChange]
  );

  const hovered = useMemo(
    () => (internalHovered ? [internalHovered, ...externalHovered] : externalHovered),
    [internalHovered, externalHovered]
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } = useTooltip<TooltipData>();

  const { TooltipInPortal } = useTooltipInPortal({
    scroll: true,
    detectBounds: true,
  });

  const numSpecies = Object.keys(data).length;
  const numPositions = Object.values(data)[0].length ?? 0;

  const canvasWidth = totalWidth - SVG_WIDTH;
  const canvasHeight = totalHeight - AXIS_HEIGHT;

  const speciesInfo = useMemo(() => {
    const entries: [string, SpeciesInfo][] = Object.keys(data).map((species) => [
      species,
      { id: species, label: getLabel(species), order: getOrder(species), color: getOrderColor(species) },
    ]);
    return new Map<string, SpeciesInfo>(entries);
  }, [data]);

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
        ctx.globalAlpha = hovered.length && !hovered.includes(species) ? 0.3 : 1;
        ctx.fillRect(x, y, 1, 1);
        ctx.globalAlpha = 1;
      });
    });
  }, [data, canvasWidth, canvasHeight, numPositions, numSpecies, hovered]);

  // Map mouse position on canvas to correct data point
  const handleHeatmapMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const position = Math.floor(((e.clientX - rect.left) / rect.width) * numPositions);
    const speciesIndex = Math.floor(((e.clientY - rect.top) / rect.height) * numSpecies);
    const speciesId = Object.keys(data)[speciesIndex];
    const basePair = data[speciesId][position];

    if (position >= 0 && position < numPositions && speciesIndex >= 0 && speciesIndex < numSpecies) {
      //want to prevent state from being set unnecessarily
      handleSetInternalHover(speciesId);
      showTooltip({
        tooltipTop: e.clientY,
        tooltipLeft: e.clientX,
        tooltipData: { position, basePair, ...(speciesInfo.get(speciesId) as SpeciesInfo) },
      });
    } else {
      handleSetInternalHover(null);
      hideTooltip();
    }
  };

  const handleHeatmapMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleSetInternalHover(null);
    hideTooltip();
  };

  const handleSpeciesBarMouseMove = (event: React.MouseEvent<SVGGElement, MouseEvent>, species: SpeciesInfo) => {
    handleSetInternalHover(species.id);
    showTooltip({ tooltipLeft: event.clientX, tooltipTop: event.clientY, tooltipData: species });
  };

  const handleSpeciesBarMouseLeave = (event: React.MouseEvent<SVGGElement, MouseEvent>, species: SpeciesInfo) => {
    handleSetInternalHover(null);
    hideTooltip();
  };

  const xScale = scaleLinear({
    domain: [0, numPositions - 1],
    range: [0, canvasWidth],
  });

  const speciesList = useMemo(() => [...speciesInfo.values()], [speciesInfo]);

  return (
    <div
      style={{
        position: "relative",
        width: totalWidth,
        height: totalHeight,
      }}
    >
      <svg
        width={SVG_WIDTH}
        height={canvasHeight}
        style={{ top: 0, left: 0, position: "absolute" }}
      >
        <Group>
          {speciesList.map((species, i) => {
            const rectHeight = canvasHeight / speciesList.length;

            return (
              <g
                key={i}
                onMouseMove={(event) => handleSpeciesBarMouseMove(event, species)}
                onMouseLeave={(event) => handleSpeciesBarMouseLeave(event, species)}
                opacity={hovered.length && !hovered.includes(species.id) ? 0.3 : 1}
              >
                {highlighted.includes(species.id) && (
                  <rect
                    width={HIGHLIGHTED_BAR_WIDTH}
                    height={rectHeight}
                    x={0}
                    y={rectHeight * i}
                    fill={species.color}
                    shapeRendering={"crispEdges"}
                  />
                )}
                <rect
                  width={SPECIES_BAR_WIDTH}
                  height={rectHeight}
                  x={HIGHLIGHTED_BAR_WIDTH + PADDING}
                  y={rectHeight * i}
                  fill={species.color}
                  shapeRendering={"crispEdges"}
                />
              </g>
            );
          })}
        </Group>
      </svg>
      <canvas
        ref={canvasRef}
        onMouseMove={handleHeatmapMouseMove}
        onMouseLeave={handleHeatmapMouseLeave}
        style={{ position: "absolute", left: SVG_WIDTH }}
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
            "Position in cCRE\u00A0\u00A0\u00A0•\u00A0\u00A0\u00A0🟢\u00A0A\u00A0\u00A0\u00A0🔵\u00A0C\u00A0\u00A0\u00A0🟠\u00A0G\u00A0\u00A0\u00A0🔴\u00A0T"
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
