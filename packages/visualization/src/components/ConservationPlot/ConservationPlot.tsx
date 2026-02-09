import React, { useRef, useEffect, useState } from "react";
import { AxisBottom } from "@visx/axis";
import { scaleLinear } from "@visx/scale";

export type Nucleotide = "A" | "C" | "G" | "T" | "-";

interface HeatmapProps {
  data: Nucleotide[][]; // [species][position]
  speciesLabels?: string[];
  width?: number;
  height?: number;
}

const NUCLEOTIDE_COLORS: Record<Nucleotide, string> = {
  A: "#228b22", // green
  C: "blue", // blue
  G: "orange", // orange
  T: "#F44336", // red
  "-": "white", // gap / missing
};

const AXIS_HEIGHT = 30;

export const Heatmap: React.FC<HeatmapProps> = ({
  data,
  speciesLabels = [],
  width = 500,
  height = 240,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    value: Nucleotide;
  } | null>(null);

  const numSpecies = data.length;
  const numPositions = data[0]?.length ?? 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // Bitmap resolution
    canvas.width = numPositions * dpr;
    canvas.height = numSpecies * dpr;

    // CSS size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Scale so 1 data unit = 1 cell in CSS space
    const scaleX = (width / numPositions) * dpr;
    const scaleY = (height / numSpecies) * dpr;
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

    // Draw
    for (let y = 0; y < numSpecies; y++) {
      for (let x = 0; x < numPositions; x++) {
        const base = data[y][x];
        ctx.fillStyle = NUCLEOTIDE_COLORS[base] ?? "#000";
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [data, numSpecies, numPositions, width, height]);

  // Hover mapping
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const x = Math.floor(((e.clientX - rect.left) / rect.width) * numPositions);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * numSpecies);

    if (x >= 0 && x < numPositions && y >= 0 && y < numSpecies) {
      setHover({ x, y, value: data[y][x] });
    } else {
      setHover(null);
    }
  };

  const xScale = scaleLinear({
    domain: [0, numPositions - 1],
    range: [0, width],
  });

  return (
    <div
      style={{
        position: "relative",
        width,
        height: height + AXIS_HEIGHT,
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
        style={{ display: "block" }}
      />

      {/* Bottom axis */}
      <svg
        width={width}
        height={AXIS_HEIGHT}
        style={{
          position: "absolute",
          left: 0,
          top: height,
          pointerEvents: "none",
        }}
      >
        <AxisBottom
          scale={xScale}
          tickLength={4}
          stroke="#000"
          tickStroke="#000"
          tickFormat={(d) => `${d}`}
        />
      </svg>

      {/* Tooltip */}
      {hover && (
        <div
          style={{
            position: "absolute",
            left: (hover.x / numPositions) * width + 6,
            top: (hover.y / numSpecies) * height + 6,
            background: "rgba(0,0,0,0.75)",
            color: "#fff",
            padding: "2px 6px",
            fontSize: 12,
            borderRadius: 3,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {speciesLabels[hover.y] ?? `Species ${hover.y}`} • pos {hover.x} • {hover.value}
        </div>
      )}
    </div>
  );
};
