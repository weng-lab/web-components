import React, { useRef, useEffect, useState, useMemo, useCallback, ReactNode } from "react";
import { AxisBottom } from "@visx/axis";
import { scaleLinear } from "@visx/scale";
import { defaultStyles, useTooltip, useTooltipInPortal } from "@visx/tooltip";
import { Group } from "@visx/group";
import { Text } from "@visx/text";

export type Nucleotide = "A" | "C" | "G" | "T" | "-";

const NUCLEOTIDE_COLORS: Record<Nucleotide, string> = {
  A: "#228b22",
  C: "blue",
  G: "orange",
  T: "red",
  "-": "white",
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
  highlighted?: string[];
  /**
   * Optionally define tooltip for hover over leaf nodes
   */
  tooltipContents?: (tooltipData: TooltipData) => ReactNode;
}

const AXIS_HEIGHT = 50;
const SPECIES_BAR_WIDTH = 30;
const HIGHLIGHTED_BAR_WIDTH = 10;
const PADDING = 10;
const HIGHLIGHTED_AND_SPECIES_SVG_WIDTH = HIGHLIGHTED_BAR_WIDTH + PADDING + SPECIES_BAR_WIDTH + PADDING;
const MIN_SCALE = 1;
const MAX_SCALE = 50;
const ZOOM_FACTOR = 1.15;
const AXIS_LEFT_PADDING = 5

export type SpeciesInfo = { id: string; label: string; order: string; color: string };

export type TooltipData = SpeciesInfo & {
  basePair?: Nucleotide;
  position?: number;
};

interface ZoomTransform {
  scaleX: number;
  translateX: number;
}

/**
 * Clamps translateX so the data never scrolls outside the canvas bounds.
 * Valid range: [canvasWidth * (1 - scaleX), 0]
 */
const clampTranslateX = (translateX: number, scaleX: number, canvasWidth: number): number =>
  Math.min(0, Math.max(canvasWidth * (1 - scaleX), translateX));

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
  const [zoomTransform, setZoomTransform] = useState<ZoomTransform>({ scaleX: 1, translateX: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Refs for event handlers that need current values without being in dependency arrays
  const zoomTransformRef = useRef<ZoomTransform>(zoomTransform);
  const dragStartX = useRef(0);
  const dragStartTranslateX = useRef(0);

  // Keep ref in sync so the wheel handler (attached imperatively) always sees current transform
  useEffect(() => {
    zoomTransformRef.current = zoomTransform;
  }, [zoomTransform]);

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

  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } = useTooltip<TooltipData>();

  const { TooltipInPortal } = useTooltipInPortal({
    scroll: true,
    detectBounds: true,
  });

  const numSpecies = Object.keys(data).length;
  const numPositions = Object.values(data)[0].length ?? 0;

  const canvasWidth = totalWidth - HIGHLIGHTED_AND_SPECIES_SVG_WIDTH;
  const canvasHeight = totalHeight - AXIS_HEIGHT;

  const speciesInfo = useMemo(() => {
    const entries: [string, SpeciesInfo][] = Object.keys(data).map((species) => [
      species,
      { id: species, label: getLabel(species), order: getOrder(species), color: getOrderColor(species) },
    ]);
    return new Map<string, SpeciesInfo>(entries);
  }, [data]);

  // Attach wheel listener imperatively with passive: false so we can call preventDefault.
  // React 17+ attaches onWheel passively, which prevents scroll cancellation.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const { scaleX, translateX } = zoomTransformRef.current;

      const zoomDir = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      const newScaleX = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scaleX * zoomDir));

      // Adjust translateX so the data point under the cursor stays fixed
      const newTranslateX = cursorX - (cursorX - translateX) * (newScaleX / scaleX);
      const clampedTranslateX = clampTranslateX(newTranslateX, newScaleX, canvasWidth);

      setZoomTransform({ scaleX: newScaleX, translateX: clampedTranslateX });
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [canvasWidth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Combine the base data→bitmap mapping with the zoom transform.
    // translateX is in CSS pixels so it must be scaled by dpr for the bitmap.
    const bitmapScaleX = (canvas.width / numPositions) * zoomTransform.scaleX;
    const bitmapScaleY = canvas.height / numSpecies;
    const bitmapTranslateX = zoomTransform.translateX * dpr;

    ctx.setTransform(bitmapScaleX, 0, 0, bitmapScaleY, bitmapTranslateX, 0);

    Object.entries(data).forEach(([species, sequence], y) => {
      sequence.forEach((nucleotide, x) => {
        ctx.fillStyle = NUCLEOTIDE_COLORS[nucleotide];
        ctx.globalAlpha = hovered.length && !hovered.includes(species) ? 0.3 : 1;
        ctx.fillRect(x, y, 1, 1);
        ctx.globalAlpha = 1;
      });
    });
  }, [data, canvasWidth, canvasHeight, numPositions, numSpecies, hovered, zoomTransform]);

  // Converts a CSS pixel x position on the canvas to a data-space nucleotide index,
  // inverting the zoom transform: dataX = (cssX - translateX) / (cssWidthPerDataUnit * scaleX)
  const cssXToPosition = useCallback(
    (cssX: number): number => {
      const { scaleX, translateX } = zoomTransformRef.current;
      return Math.floor(((cssX - translateX) / canvasWidth) * (numPositions / scaleX));
    },
    [canvasWidth, numPositions]
  );

  const handleHeatmapMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartTranslateX.current = zoomTransformRef.current.translateX;
  };

  const handleHeatmapMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // While dragging: update pan, suppress hover/tooltip
    if (isDragging) {
      const delta = e.clientX - dragStartX.current;
      const newTranslateX = clampTranslateX(
        dragStartTranslateX.current + delta,
        zoomTransformRef.current.scaleX,
        canvasWidth
      );
      setZoomTransform((prev) => ({ ...prev, translateX: newTranslateX }));
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;

    const position = cssXToPosition(cssX);
    const speciesIndex = Math.floor((cssY / rect.height) * numSpecies);
    const speciesId = Object.keys(data)[speciesIndex];
    const basePair = data[speciesId]?.[position];

    if (position >= 0 && position < numPositions && speciesIndex >= 0 && speciesIndex < numSpecies) {
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

  const handleHeatmapMouseUp = () => {
    setIsDragging(false);
  };

  const handleHeatmapMouseLeave = () => {
    setIsDragging(false);
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

  // Apply the zoom transform to the axis scale so tick positions stay in sync with the canvas.
  // Domain [0, numPositions-1] maps to zoomed CSS range [translateX, canvasWidth * scaleX + translateX].
  const zoomedXScale = useMemo(
    () =>
      scaleLinear({
        domain: [0, numPositions - 1],
        range: [
          zoomTransform.translateX,
          canvasWidth * zoomTransform.scaleX + zoomTransform.translateX,
        ],
      }),
    [numPositions, canvasWidth, zoomTransform]
  );

  const speciesList = useMemo(() => [...speciesInfo.values()], [speciesInfo]);

  const axisWidth = canvasWidth + AXIS_LEFT_PADDING

  return (
    <div
      style={{
        position: "relative",
        width: totalWidth,
        height: totalHeight,
      }}
    >
      <svg
        width={HIGHLIGHTED_AND_SPECIES_SVG_WIDTH}
        height={totalHeight}
        style={{ top: 0, left: 0, position: "absolute" }}
      >
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
        <Text
          angle={270}
          textAnchor="end"
          verticalAnchor="middle"
          fontSize={12}
          x={0.5 * HIGHLIGHTED_BAR_WIDTH}
          y={canvasHeight + 2}
        >
          Highlight
        </Text>
        <Text
          angle={270}
          textAnchor="end"
          verticalAnchor="middle"
          fontSize={12}
          x={HIGHLIGHTED_BAR_WIDTH + PADDING + 0.5 * SPECIES_BAR_WIDTH}
          y={canvasHeight + 2}
        >
          Species
        </Text>
      </svg>
      <canvas
        ref={canvasRef}
        onMouseDown={handleHeatmapMouseDown}
        onMouseMove={handleHeatmapMouseMove}
        onMouseUp={handleHeatmapMouseUp}
        onMouseLeave={handleHeatmapMouseLeave}
        style={{
          position: "absolute",
          left: HIGHLIGHTED_AND_SPECIES_SVG_WIDTH,
          cursor: isDragging ? "grabbing" : zoomTransform.scaleX > 1 ? "grab" : "default",
        }}
      />
      {/* overflow: hidden clips axis ticks that scroll outside the canvas bounds when zoomed */}
      <svg
        width={axisWidth}
        height={AXIS_HEIGHT}
        style={{
          position: "absolute",
          //position it into the other svg by AXIS_LEFT_PADDING to fix axis cutoff of 0 at first load.
          //can't fix with overflow visible since on zoom the axis needs to be clipped
          left: HIGHLIGHTED_AND_SPECIES_SVG_WIDTH - AXIS_LEFT_PADDING,
          bottom: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <AxisBottom
          scale={zoomedXScale}
          numTicks={Math.min(numPositions, Math.round(10 * zoomTransform.scaleX))}
          left={AXIS_LEFT_PADDING}
        />
        <Text fontSize={12} textAnchor="middle" verticalAnchor="end" x={axisWidth / 2} y={AXIS_HEIGHT - 4}>
          {
            "Position in cCRE\u00A0\u00A0\u00A0•\u00A0\u00A0\u00A0🟢\u00A0A\u00A0\u00A0\u00A0🔵\u00A0C\u00A0\u00A0\u00A0🟠\u00A0G\u00A0\u00A0\u00A0🔴\u00A0T"
          }
        </Text>
        <Text fontSize={12} textAnchor="end" verticalAnchor="end" x={axisWidth} y={AXIS_HEIGHT - 4}>
          {`${zoomTransform.scaleX.toFixed(2)}\u00d7`}
        </Text>
      </svg>
      {tooltipData && tooltipContents && (
        <TooltipInPortal left={tooltipLeft} top={tooltipTop} style={defaultStyles}>
          {tooltipContents(tooltipData)}
        </TooltipInPortal>
      )}
    </div>
  );
};