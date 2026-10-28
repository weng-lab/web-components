import { ProvidedZoom } from "@visx/zoom";
import { localPoint } from "@visx/event";
import { memo, ReactNode, useEffect, useRef } from "react";
import { Add, Remove, SettingsBackupRestore, Timeline } from "@mui/icons-material";
import { ZoomState } from "./types";
import { Group } from "@visx/group";
import { TOTAL_INNER_DIAMETER, ZOOM_SCALE_LIMITS } from "./PhyloTree";
import { followFingers, toLocal, useStableCallback, useTwoFingerGestures, useTwoFingerHint } from "../../hooks";
import { ControlPanel, TwoFingerHint } from "../../controls";

export type ZoomFrameProps = {
  zoom: ProvidedZoom<SVGSVGElement> & ZoomState;
  totalHeight: number;
  totalWidth: number;
  toggleBranchLength: () => void;
  children: ReactNode
};

/**
 * The tree's svg, which a mouse drag, the wheel or two fingers pan and zoom. visx's own handlers
 * (zoom.containerRef) stay unattached: they pan with one finger, which would block page scrolling.
 */
export const ZoomFrame = memo(function({ zoom, totalWidth, totalHeight, children, toggleBranchLength }: ZoomFrameProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Non-passive (React's onWheel is passive), so it can stop the page scrolling.
  const handleWheel = useStableCallback(zoom.handleWheel);
  useEffect(() => {
    const svg = svgRef.current;
    svg?.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg?.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const touchAction = useTwoFingerGestures(svgRef, {
    onStart: () => zoom.transformMatrix,
    onMove: ({ from, to, scale }, start) => {
      const svg = svgRef.current;
      if (!svg) return;
      zoom.setTransformMatrix(followFingers(start, toLocal(svg, from), toLocal(svg, to), scale, ZOOM_SCALE_LIMITS));
    },
  });

  const hint = useTwoFingerHint(svgRef);

  // Double-click zooms; a double tap is two taps on a branch.
  const pointerTypeRef = useRef("mouse");

  return (
    <div
      style={{
        position: "relative",
        width: totalWidth,
        height: totalHeight,
      }}
    >
      <ControlPanel
        style={{ position: "absolute", margin: 4 }}
        buttons={[
          { label: "Zoom in", icon: <Add fontSize="small" />, onClick: () => zoom.scale({ scaleX: 1.2, scaleY: 1.2 }) },
          { label: "Zoom out", icon: <Remove fontSize="small" />, onClick: () => zoom.scale({ scaleX: 1 / 1.2, scaleY: 1 / 1.2 }) },
          { label: "Reset zoom", icon: <SettingsBackupRestore fontSize="small" />, onClick: zoom.reset },
          { label: "Toggle evolutionary distance", icon: <Timeline fontSize="small" />, onClick: toggleBranchLength },
        ]}
      />
      <svg
        ref={svgRef}
        width={totalWidth}
        height={totalHeight}
        style={{ cursor: zoom.isDragging ? "grabbing" : "grab", touchAction }}
        viewBox={`0 0 ${TOTAL_INNER_DIAMETER} ${TOTAL_INNER_DIAMETER}`}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={(event) => {
          pointerTypeRef.current = event.pointerType;
        }}
        onMouseDown={zoom.dragStart}
        onMouseMove={zoom.dragMove}
        onMouseUp={zoom.dragEnd}
        onMouseLeave={() => {
          if (zoom.isDragging) zoom.dragEnd();
        }}
        onDoubleClick={(event) => {
          if (pointerTypeRef.current === "touch") return;
          zoom.scale({ scaleX: 1.5, scaleY: 1.5, point: localPoint(event) ?? undefined });
        }}
      >
        <Group transform={zoom.toString()}>
          {children}
        </Group>
      </svg>
      <TwoFingerHint shown={hint} style={{ inset: 0 }} />
    </div>
  );
});
