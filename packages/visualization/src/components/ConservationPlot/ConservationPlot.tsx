import React, { useRef, useEffect, useState } from "react";
import { AxisBottom } from "@visx/axis";
import { scaleLinear } from "@visx/scale";

export interface ConservationPlotProps {
  data: number[][]; // 2D array [species][position], values 0-1
  speciesLabels?: string[]; // optional labels for y-axis
  width?: number; // CSS width in pixels
  height?: number; // CSS height in pixels
}

export const ConservationPlot: React.FC<ConservationPlotProps> = ({
  data,
  speciesLabels = [],
  width = 500,
  height = 240,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; value: number } | null>(null);

  const numSpecies = data.length;
  const numPositions = data[0]?.length || 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // Canvas bitmap resolution
    canvas.width = numPositions * dpr;
    canvas.height = numSpecies * dpr;

    // CSS size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Scale context for high-DPI and CSS scaling
    const scaleX = (width / numPositions) * dpr;
    const scaleY = (height / numSpecies) * dpr;
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

    // Draw heatmap
    for (let y = 0; y < numSpecies; y++) {
      for (let x = 0; x < numPositions; x++) {
        const value = data[y][x];
        const colorValue = Math.floor(value * 255);
        ctx.fillStyle = `rgb(${255 - colorValue}, ${255 - colorValue}, 255)`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [data, numSpecies, numPositions, width, height]);

  // Map mouse to data indices
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const mouseX = ((e.clientX - rect.left) / rect.width) * numPositions;
    const mouseY = ((e.clientY - rect.top) / rect.height) * numSpecies;

    const xIndex = Math.floor(mouseX);
    const yIndex = Math.floor(mouseY);

    if (xIndex >= 0 && xIndex < numPositions && yIndex >= 0 && yIndex < numSpecies) {
      setHover({ x: xIndex, y: yIndex, value: data[yIndex][xIndex] });
    } else {
      setHover(null);
    }
  };

  const handleMouseLeave = () => setHover(null);

  // Create x scale for bottom axis
  const xScale = scaleLinear<number>({
    domain: [0, numPositions - 1],
    range: [0, width],
  });

  return (
    <div style={{ position: "relative", width, height: height + 30 /* space for axis */ }}>
      {/* Canvas heatmap */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ display: "block" }}
      />

      {/* Bottom axis using SVG overlay */}
      <svg
        width={width}
        height={30}
        overflow={'visible'}
        style={{
          position: "absolute",
          left: 0,
          top: height,
          pointerEvents: "none",
        }}
      >
        <AxisBottom
          scale={xScale}
          tickFormat={(d) => `${d}`}
          tickLength={4}
          stroke="#000"
          tickStroke="#000"
          label="Position"
          top={0}
        />
      </svg>

      {/* Hover tooltip */}
      {hover && (
        <div
          style={{
            position: "absolute",
            left: (hover.x / numPositions) * width + 5,
            top: (hover.y / numSpecies) * height + 5,
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            padding: "2px 5px",
            fontSize: 12,
            pointerEvents: "none",
            borderRadius: 3,
            whiteSpace: "nowrap",
          }}
        >
          {speciesLabels[hover.y] || `Species ${hover.y} Position ${hover.x}`} : {hover.value.toFixed(2)}
        </div>
      )}
    </div>
  );
};
