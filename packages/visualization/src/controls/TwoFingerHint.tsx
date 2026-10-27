import { Typography } from "@mui/material";
import type { CSSProperties } from "react";

export type TwoFingerHintProps = {
  /** From useTwoFingerHint. */
  shown: boolean;
  text?: string;
  /** Where it goes: over the plot's area, in a positioned container. */
  style?: CSSProperties;
};

/**
 * "Use two fingers to zoom and pan", faded in over a plot while one finger drags across it - see
 * useTwoFingerHint. It takes no touches, so the page scrolls on beneath it.
 */
export const TwoFingerHint = ({ shown, text = "Use two fingers to zoom and pan", style }: TwoFingerHintProps) => (
  <div
    aria-hidden
    style={{
      position: "absolute",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxSizing: "border-box",
      padding: 16,
      background: "rgba(0, 0, 0, 0.5)",
      pointerEvents: "none",
      opacity: shown ? 1 : 0,
      transition: "opacity 200ms ease-out",
      ...style,
    }}
  >
    <Typography variant="body2" color="#fff" textAlign="center" fontWeight={500}>
      {text}
    </Typography>
  </div>
);
