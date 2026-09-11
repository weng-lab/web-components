import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import HeatmapMiniMap, { type HeatmapMiniMapProps } from "./HeatmapMiniMap";

// The expanded minimap opens as a viewport-fixed modal sized off the screen, not the plot's own
// (often much smaller) container - nearly the whole screen, but leaving a visible backdrop margin
// so it still reads as a popup rather than a page navigation.
const MINI_MAP_POPUP_WIDTH_VW = 94;
const MINI_MAP_POPUP_HEIGHT_VH = 90;
const MINI_MAP_POPUP_PADDING = 16;
// `position: fixed` only escapes to the viewport if every ancestor is un-transformed; a single
// transform/filter/will-change/contain anywhere between the heatmap and <body> in a consuming
// app re-scopes it to that ancestor instead, letting unrelated elements elsewhere on the page
// stack above it regardless of z-index. Portaling straight to document.body below sidesteps
// that; the max practical z-index on top of it is belt-and-suspenders against anything else on
// the host page (app chrome, third-party widgets) that also claims a very high value.
const MINI_MAP_POPUP_Z_INDEX = 2147483647;

type MiniMapPassThroughProps = Omit<HeatmapMiniMapProps, "width" | "height" | "onCanvasClick">;

export interface HeatmapMiniMapPopupProps extends MiniMapPassThroughProps {
  onClose: () => void;
  /** The inline minimap's own container - counts as "inside" for the outside-click check below. */
  containerRef: RefObject<HTMLDivElement | null>;
}

const HeatmapMiniMapPopup = ({ onClose, containerRef, ...miniMapProps }: HeatmapMiniMapPopupProps) => {
  // The popup itself lives outside containerRef in the tree (it's positioned relative to the
  // plot's outer container, not the small inline minimap) - both refs count as "inside" here.
  const popupRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || popupRef.current?.contains(target)) return;
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
  }, [containerRef, onClose]);

  // The expanded minimap's canvas needs real pixel dimensions (for dpr scaling), but the popup
  // itself is sized by CSS (vw/vh) against the viewport, which can change as the window resizes
  // while the popup is open - ResizeObserver on the flex-filled area inside it is what actually
  // measures that, rather than computing it from window.innerWidth/innerHeight up front.
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  // The minimap draws its entire dataset with no windowing, so for large grids the popup can sit
  // blank for a noticeable moment after opening - a skeleton fills that gap instead of looking
  // like the popup hung. Owned here (not inside HeatmapMiniMap) since only the expanded view is
  // large/slow enough to warrant one; the small always-visible inline minimap doesn't need it.
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

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: MINI_MAP_POPUP_Z_INDEX, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
        {/* A proper title bar, not just a close button floating in extra top padding - its
            horizontal padding matches the body's below so the panel reads as evenly framed. */}
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
        <div style={{ flex: 1, minHeight: 0, display: "flex", padding: MINI_MAP_POPUP_PADDING }}>
          <div ref={areaRef} style={{ flex: 1, minHeight: 0, position: "relative" }}>
            {/* Rendered as soon as the popup mounts, independent of `size` - the area div is
                already laid out by CSS (flex: 1) on this same paint, so the skeleton can fill it
                immediately. Waiting on `size` (the async ResizeObserver round-trip) would leave a
                blank gap before the skeleton itself shows up, which is exactly what it's meant to
                cover. */}
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
                    // Matches the viewport-rectangle accent color HeatmapMiniMap itself uses.
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
