import { ProvidedZoom } from "@visx/zoom/lib/types";
import { memo, ReactNode, useState } from "react";
import { ZoomState } from "./types";
import { ControlPanel } from "./ControlPanel";
import { ZoomSurface } from "./ZoomSurface";
import { Group } from "@visx/group";
import { INNER_DIAMETER } from "./PhyloTree";

export type ZoomFrameProps = {
  zoom: ProvidedZoom<SVGSVGElement> & ZoomState;
  totalHeight: number;
  totalWidth: number;
  toggleBranchLength: () => void;
  children: ReactNode
};

export const ZoomFrame = memo(function({ zoom, totalWidth, totalHeight, children, toggleBranchLength }: ZoomFrameProps) {
  return (
    <div
      style={{
        position: "relative",
        border: "1px solid black",
        width: totalWidth,
        height: totalHeight,
        boxSizing: "content-box",
      }}
    >
      <ControlPanel scaleZoom={zoom.scale} resetZoom={zoom.reset} toggleBranchLength={toggleBranchLength} />
      <svg
        width={totalWidth}
        height={totalHeight}
        style={{ cursor: zoom.isDragging ? "grabbing" : "grab", touchAction: "none" }}
        viewBox={`0 0 ${INNER_DIAMETER} ${INNER_DIAMETER}`}
        preserveAspectRatio="xMidYMid meet"
        ref={zoom.containerRef}
      >
        <ZoomSurface
          dragStart={zoom.dragStart}
          dragEnd={zoom.dragEnd}
          dragMove={zoom.dragMove}
          scale={zoom.scale}
          isDragging={zoom.isDragging}
        />
        <Group transform={zoom.toString()}>
          {children}
        </Group>
      </svg>
    </div>
  );
});
