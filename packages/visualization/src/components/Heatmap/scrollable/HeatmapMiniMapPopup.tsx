import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { HeatmapLegendFrame } from "../types";
import HeatmapMiniMap, { type HeatmapMiniMapProps } from "./HeatmapMiniMap";

// Nearly the whole screen, with enough backdrop showing that it reads as a popup.
const MINI_MAP_POPUP_WIDTH_VW = 94;
const MINI_MAP_POPUP_HEIGHT_VH = 90;
const MINI_MAP_POPUP_PADDING = 16;
// Portaled to <body>, since a transformed ancestor would trap `position: fixed`, and stacked
// above anything else the host page puts on top.
const MINI_MAP_POPUP_Z_INDEX = 2147483647;
// The legend's band across the top: long enough to sweep with some precision.
const LEGEND_BAND_WIDTH = 440;
const LEGEND_BAND_HEIGHT = 40;
const LEGEND_BAND_GAP = 12;

type MiniMapPassThroughProps = Omit<HeatmapMiniMapProps, "width" | "height" | "onCanvasClick">;

export interface HeatmapMiniMapPopupProps extends MiniMapPassThroughProps {
  onClose: () => void;
  /** The inline minimap's container, where a click doesn't count as outside the popup. */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Draws the plot's legend in a band across the top. Omitted where the plot shows no legend. */
  legend?: (frame: HeatmapLegendFrame) => ReactNode;
}

const HeatmapMiniMapPopup = ({ onClose, containerRef, legend, ...miniMapProps }: HeatmapMiniMapPopupProps) => {
  const popupRef = useRef<HTMLDivElement | null>(null);
  // The legend's tooltips portal into the backdrop to show above the popup. State rather than a
  // ref, so the legend re-renders once it exists.
  const [backdrop, setBackdrop] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || popupRef.current?.contains(target)) return;
      // An overlay the legend opened is part of the popup too; the backdrop itself is outside it.
      if (backdrop && target !== backdrop && backdrop.contains(target)) return;
      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, onClose, backdrop]);

  // The canvas needs pixel dimensions; the popup is sized in vw/vh, so the area is measured as it resizes.
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  // A spinner covers the first draw, which can take a moment on a large grid.
  const [isReady, setIsReady] = useState(false);
  const handleReady = useCallback(() => setIsReady(true), []);
  const observerRef = useRef<ResizeObserver | null>(null);
  const areaRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) {
      setSize(null);
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width: Math.floor(width), height: Math.floor(height) });
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  // Narrower only where the popup itself is: on a phone.
  const legendBandWidth = Math.min(LEGEND_BAND_WIDTH, size?.width ?? LEGEND_BAND_WIDTH);

  return createPortal(
    <div
      ref={setBackdrop}
      style={{ position: "fixed", inset: 0, zIndex: MINI_MAP_POPUP_Z_INDEX, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <style>{"@keyframes heatmapMiniMapSpinnerRotate { to { transform: rotate(360deg); } }"}</style>
      <div
        ref={popupRef}
        style={{
          position: "relative",
          width: `${MINI_MAP_POPUP_WIDTH_VW}vw`,
          height: `${MINI_MAP_POPUP_HEIGHT_VH}vh`,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          border: "1px solid #d5d5d5",
          borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `10px ${MINI_MAP_POPUP_PADDING}px`,
            background: "#f7f7f8",
            borderBottom: "1px solid #e5e5e5",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>Minimap</span>
          <button
            type="button"
            aria-label="Close expanded minimap"
            onClick={onClose}
            style={{
              width: 26,
              height: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              border: "none",
              borderRadius: "50%",
              background: "#fff",
              color: "#555",
              fontSize: 16,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: LEGEND_BAND_GAP, padding: MINI_MAP_POPUP_PADDING }}>
          {legend && (
            // Above the map rather than beside it: the popup is wide, so a band costs the map less.
            <svg
              width={legendBandWidth}
              height={LEGEND_BAND_HEIGHT}
              style={{ flexShrink: 0, display: "block", overflow: "visible" }}
            >
              {legend({
                width: legendBandWidth,
                height: LEGEND_BAND_HEIGHT,
                orientation: "horizontal",
                overlayContainer: backdrop ?? undefined,
              })}
            </svg>
          )}
          <div ref={areaRef} style={{ flex: 1, minHeight: 0, position: "relative" }}>
            {/* Not gated on `size`, so it shows on the first paint rather than after the measurement. */}
            {!isReady && (
              <div
                aria-label="Loading minimap"
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "4px solid #e5e5e5",
                    // The minimap's viewport-rectangle color.
                    borderTopColor: "#0d0f98",
                    animation: "heatmapMiniMapSpinnerRotate 0.8s linear infinite",
                  }}
                />
              </div>
            )}
            {size && size.width > 0 && size.height > 0 && (
              <HeatmapMiniMap {...miniMapProps} width={size.width} height={size.height} onReady={handleReady} />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HeatmapMiniMapPopup;
